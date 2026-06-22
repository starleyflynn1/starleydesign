/** Vite base URL — `/` locally, `/starleydesign/` on GitHub Pages project site. */
export function getAppBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

export function getAppBasePath(): string {
  return getAppBaseUrl().replace(/\/+$/, '') || '';
}

/** Strip project base from pathname so `/starleydesign/script` → `/script`. */
export function stripAppBasePath(pathname: string): string {
  const base = getAppBasePath();
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (!base) return normalized;
  if (normalized === base) return '/';
  if (normalized.startsWith(`${base}/`)) {
    return normalized.slice(base.length) || '/';
  }
  return normalized;
}

/** Prefix an app path with the Vite base for GitHub Pages. */
export function withAppBasePath(path: string): string {
  const base = getAppBaseUrl();
  if (!path || path === '/') return base;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const baseNoSlash = base.replace(/\/+$/, '');
  return `${baseNoSlash}${normalized}`;
}
