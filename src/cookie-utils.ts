export function parseCookie(str: string): Record<string, string> {
  const obj: Record<string, string> = {};
  if (!str) return obj;
  str.split(';').forEach(pair => {
    const i = pair.indexOf('=');
    if (i < 0) return;
    const key = pair.slice(0, i).trim();
    const val = pair.slice(i + 1).trim();
    obj[key] = decodeURIComponent(val);
  });
  return obj;
}

export function serializeCookie(name: string, val: string, options: any = {}) {
  let str = `${name}=${encodeURIComponent(val)}`;
  if (options.maxAge != null) str += `; Max-Age=${options.maxAge}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  return str;
}
