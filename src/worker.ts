import { parseCookie, serializeCookie } from './cookie-utils';

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  ASSETS: { fetch: (req: Request | URL | string) => Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const pathname = url.pathname;

    const jsonResponse = (data: any, status = 200, extraHeaders: HeadersInit = {}) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...extraHeaders,
        }
      });
    };

    const htmlResponse = (html: string, status = 200, extraHeaders: HeadersInit = {}) => {
      return new Response(html, {
        status,
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          ...corsHeaders,
          ...extraHeaders,
        }
      });
    };

    // Parse cookies
    const cookies = parseCookie(request.headers.get('Cookie') || '');
    const githubToken = cookies.githubToken;
    const sessionState = cookies.oauth_state;

    // ----- API ROUTES -----
    if (pathname.startsWith('/api/')) {
      
      if (pathname === '/api/auth/github/diagnostics') {
        return jsonResponse({
          clientIdLoaded: !!env.GITHUB_CLIENT_ID,
          clientSecretLoaded: !!env.GITHUB_CLIENT_SECRET,
          sessionConfigured: !!env.SESSION_SECRET,
        });
      }

      if (pathname === '/api/auth/github/login' || pathname === '/api/auth/github/url') {
        const clientId = env.GITHUB_CLIENT_ID;
        if (!clientId) {
          if (pathname === '/api/auth/github/url') {
            return jsonResponse({ error: 'GITHUB_CLIENT_ID not configured' }, 500);
          }
          return htmlResponse(`<h2>GitHub OAuth Not Configured</h2><p>GITHUB_CLIENT_ID is missing.</p>`, 500);
        }

        const state = crypto.randomUUID().replace(/-/g, '');
        const host = request.headers.get('Host') || '';
        let baseOrigin = 'https://ramrepo.ramagro.workers.dev';
        if (url.searchParams.has('origin')) {
          baseOrigin = url.searchParams.get('origin') || baseOrigin;
        } else if (!host.includes('workers.dev')) {
          baseOrigin = origin !== '*' ? origin : `https://${host}`;
        }
        const redirectUri = `${baseOrigin}/api/auth/github/callback`;
        const scope = 'repo read:org user:email';
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

        const cookieHeader = serializeCookie('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
        
        if (pathname === '/api/auth/github/url') {
          return jsonResponse({ url: githubAuthUrl }, 200, { 'Set-Cookie': cookieHeader });
        }

        return new Response(null, {
          status: 302,
          headers: {
            'Location': githubAuthUrl,
            'Set-Cookie': cookieHeader,
            ...corsHeaders
          }
        });
      }

      if (pathname === '/api/auth/github/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        if (!code || !state || state !== sessionState) {
          return new Response(null, {
            status: 302,
            headers: {
              'Location': '/',
              ...corsHeaders
            }
          });
        }
        try {
          const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              client_id: env.GITHUB_CLIENT_ID,
              client_secret: env.GITHUB_CLIENT_SECRET,
              code
            })
          });
          
          const contentType = tokenRes.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            return htmlResponse(`<h2>Authentication Failed</h2><p>Unexpected response from GitHub.</p>`, 500);
          }
          
          const tokenData: any = await tokenRes.json();
          if (tokenData.access_token) {
            const headers = new Headers();
            headers.append('Set-Cookie', serializeCookie('githubToken', tokenData.access_token, { httpOnly: true, secure: true, sameSite: 'none', path: '/' }));
            headers.append('Set-Cookie', serializeCookie('oauth_state', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 }));
            headers.append('Location', '/');
            return new Response(null, {
              status: 302,
              headers: headers
            });
          } else {
            return htmlResponse(`<h2>Authentication Failed</h2><p>Could not get access token.</p>`, 400);
          }
        } catch (error) {
          return htmlResponse(`<h2>Internal Server Error</h2><p>An error occurred.</p>`, 500);
        }
      }

      if (pathname === '/api/auth/github/me' || pathname === '/api/auth/status' || pathname === '/api/auth/session') {
        if (!githubToken) {
          return jsonResponse({ authenticated: false }, 401);
        }

        try {
          const userRes = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Cloudflare-Worker'
            }
          });

          if (!userRes.ok) {
            if (userRes.status === 401) {
              const clearCookie = serializeCookie('githubToken', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 });
              return jsonResponse({ authenticated: false }, 401, { 'Set-Cookie': clearCookie });
            }
            return jsonResponse({ error: 'Failed to fetch user' }, userRes.status);
          }

          const userData = await userRes.json();
          return jsonResponse({ authenticated: true, user: userData });
        } catch (err) {
          return jsonResponse({ error: 'Internal server error' }, 500);
        }
      }

      if (pathname === '/api/auth/github/logout' || pathname === '/api/auth/logout') {
        if (githubToken && env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
          try {
            // Revoke OAuth grant on GitHub's authorization servers
            const authHeader = 'Basic ' + btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`);
            await fetch(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/grant`, {
              method: 'DELETE',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'User-Agent': 'Cloudflare-Worker'
              },
              body: JSON.stringify({ access_token: githubToken })
            });
          } catch (e) {
            console.error("Failed to revoke GitHub token on logout:", e);
          }
        }
        const clearCookie = serializeCookie('githubToken', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 });
        return jsonResponse({ success: true }, 200, { 'Set-Cookie': clearCookie });
      }

      if (pathname.startsWith('/api/github/')) {
        if (!githubToken) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const targetPath = pathname.replace('/api/github', '');
        const targetUrl = `https://api.github.com${targetPath}${url.search}`;
        
        const fetchHeaders: Record<string, string> = {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': request.headers.get('Accept') && request.headers.get('Accept') !== '*/*' ? request.headers.get('Accept')! : 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-Workspace-Manager'
        };

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
          fetchHeaders['Content-Type'] = request.headers.get('Content-Type') || 'application/json';
        }

        const fetchOptions: RequestInit = {
          method: request.method,
          headers: fetchHeaders
        };

        if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
          fetchOptions.body = request.body as any;
        }

        try {
          const githubRes = await fetch(targetUrl, fetchOptions);
          
          const responseHeaders = new Headers(githubRes.headers);
          responseHeaders.set('Access-Control-Allow-Origin', origin);
          responseHeaders.set('Access-Control-Allow-Credentials', 'true');
          
          return new Response(githubRes.body, {
            status: githubRes.status,
            statusText: githubRes.statusText,
            headers: responseHeaders
          });
        } catch (error) {
          return jsonResponse({ error: 'Failed to contact GitHub API' }, 500);
        }
      }

      return jsonResponse({ error: 'API route not found' }, 404);
    }
    
    // Serve Static Assets (SPA Fallback)
    try {
      // First try to fetch the exact asset
      // Using Cloudflare Workers Native Assets, this might already be handled before this fetch handler
      // But if we're here, it might be a SPA route. We can fetch /index.html
      const indexUrl = new URL('/index.html', request.url);
      const res = await env.ASSETS.fetch(new Request(indexUrl));
      if (res.ok) {
        return res;
      }
    } catch(e) {}
    
    return new Response('Not Found', { status: 404 });
  }
}
