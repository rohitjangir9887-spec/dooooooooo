import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { parseCookie, serializeCookie } from './src/cookie-utils';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', async (req, res, next) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const origin = req.headers.origin || '*';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const cookies = parseCookie(req.headers.cookie || '');
  const githubToken = cookies.githubToken;
  const sessionState = cookies.oauth_state;

  const jsonResponse = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
    for (const [k, v] of Object.entries(extraHeaders)) {
      res.setHeader(k, v);
    }
    return res.status(status).json(data);
  };

  const htmlResponse = (html: string, status = 200, extraHeaders: Record<string, string> = {}) => {
    for (const [k, v] of Object.entries(extraHeaders)) {
      res.setHeader(k, v);
    }
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    return res.status(status).send(html);
  };

  if (pathname === '/auth/github/diagnostics') {
    return jsonResponse({
      clientIdLoaded: !!process.env.GITHUB_CLIENT_ID,
      clientSecretLoaded: !!process.env.GITHUB_CLIENT_SECRET,
      sessionConfigured: !!process.env.SESSION_SECRET,
    });
  }

  if (pathname === '/auth/github/login' || pathname === '/auth/github/url') {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      if (pathname === '/auth/github/url') {
        return jsonResponse({ error: 'GITHUB_CLIENT_ID not configured' }, 500);
      }
      return htmlResponse(`<h2>GitHub OAuth Not Configured</h2><p>GITHUB_CLIENT_ID is missing.</p>`, 500);
    }

    const state = Math.random().toString(36).substring(2);
    const host = req.headers.host || '';
    let baseOrigin = process.env.APP_URL || `https://${host}`;
    if (url.searchParams.has('origin')) {
      baseOrigin = url.searchParams.get('origin') || baseOrigin;
    } else if (!host.includes('workers.dev') && !host.includes('run.app') && host !== 'localhost:3000') {
      baseOrigin = `https://${host}`;
    }
    const redirectUri = `${baseOrigin}/api/auth/github/callback`;
    const scope = 'repo read:org user:email';
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    const cookieHeader = serializeCookie('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none', path: '/' });
    res.setHeader('Set-Cookie', cookieHeader);

    if (pathname === '/auth/github/url') {
      return jsonResponse({ url: githubAuthUrl }, 200);
    }

    return res.redirect(githubAuthUrl);
  }

  if (pathname === '/auth/github/callback') {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!code || !state || state !== sessionState) {
      return res.redirect('/');
    }
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      const contentType = tokenRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return htmlResponse(`<h2>Authentication Failed</h2><p>Unexpected response from GitHub.</p>`, 500);
      }

      const tokenData: any = await tokenRes.json();
      if (tokenData.access_token) {
        res.setHeader('Set-Cookie', [
          serializeCookie('githubToken', tokenData.access_token, { httpOnly: true, secure: true, sameSite: 'none', path: '/' }),
          serializeCookie('oauth_state', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 })
        ]);
        return res.redirect('/');
      } else {
        return htmlResponse(`<h2>Authentication Failed</h2><p>Could not get access token.</p>`, 400);
      }
    } catch (error) {
      return htmlResponse(`<h2>Internal Server Error</h2><p>An error occurred.</p>`, 500);
    }
  }

  if (pathname === '/auth/github/me' || pathname === '/auth/status' || pathname === '/auth/session') {
    if (!githubToken) {
      return jsonResponse({ authenticated: false }, 401);
    }

    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Cloud-Applet-Server'
        }
      });

      if (!userRes.ok) {
        if (userRes.status === 401) {
          const clearCookie = serializeCookie('githubToken', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 });
          res.setHeader('Set-Cookie', clearCookie);
          return jsonResponse({ authenticated: false }, 401);
        }
        return jsonResponse({ error: 'Failed to fetch user' }, userRes.status);
      }

      const userData = await userRes.json();
      return jsonResponse({ authenticated: true, user: userData });
    } catch (err) {
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }

  if (pathname === '/auth/github/logout' || pathname === '/auth/logout') {
    if (githubToken && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');
        await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grant`, {
          method: 'DELETE',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'User-Agent': 'Cloud-Applet-Server'
          },
          body: JSON.stringify({ access_token: githubToken })
        });
      } catch (e) {
        console.error("Failed to revoke GitHub token on logout:", e);
      }
    }
    const clearCookie = serializeCookie('githubToken', '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 });
    res.setHeader('Set-Cookie', clearCookie);
    return jsonResponse({ success: true }, 200);
  }

  if (pathname.startsWith('/github/')) {
    if (!githubToken) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const targetPath = pathname.replace('/github', '');
    const targetUrl = `https://api.github.com${targetPath}${url.search}`;

    const fetchHeaders: Record<string, string> = {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': req.headers['accept'] && req.headers['accept'] !== '*/*' ? req.headers['accept'] as string : 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Workspace-Manager'
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      fetchHeaders['Content-Type'] = req.headers['content-type'] || 'application/json';
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: fetchHeaders
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    try {
      const githubRes = await fetch(targetUrl, fetchOptions);
      const data = await githubRes.json();
      return res.status(githubRes.status).json(data);
    } catch (error) {
      return jsonResponse({ error: 'Failed to contact GitHub API' }, 500);
    }
  }

  return jsonResponse({ error: 'API route not found' }, 404);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
