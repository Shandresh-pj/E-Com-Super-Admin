/**
 * Media URL Utilities
 *
 * The backend stores media as relative paths (e.g., `/uploads/images/abc.jpg`).
 * The API base URL has a `/api` suffix (e.g., `http://10.x.x.x:3000/api`).
 * Media files are served from the root WITHOUT the `/api` prefix.
 *
 * CORRECT:  http://10.x.x.x:3000/uploads/images/abc.jpg
 * WRONG:    http://10.x.x.x:3000/api/uploads/images/abc.jpg  ← double /api
 *
 * Use `resolveMediaUrl()` everywhere an image/video URL is needed.
 */

import { getApiBaseUrl } from '../config/environment';

/**
 * Returns the base URL for media files (strips the /api suffix).
 * Example: 'http://10.x.x.x:3000/api' → 'http://10.x.x.x:3000'
 */
export const getMediaBaseUrl = (): string => {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
};

/**
 * Resolves a backend media path/URL to an absolute URL.
 *
 * Handles:
 *  - Already-absolute URLs  (http:// or https://) → returned as-is
 *  - Relative paths (/uploads/...) → prefixed with media base URL
 *  - Empty/null/undefined → returns undefined
 *
 * @param path  The raw path returned by the backend.
 * @returns     Fully qualified URL string, or undefined if path is empty.
 */
export const resolveMediaUrl = (path: string | null | undefined): string | undefined => {
  if (!path || typeof path !== 'string') return undefined;

  const trimmed = path.trim();
  if (!trimmed) return undefined;

  // Already an absolute URL — return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base = getMediaBaseUrl();
  // Ensure there's exactly one slash between base and path
  const separator = trimmed.startsWith('/') ? '' : '/';
  return `${base}${separator}${trimmed}`;
};

/**
 * Resolves an array of media paths to absolute URLs, filtering out empty ones.
 */
export const resolveMediaUrls = (paths: (string | null | undefined)[] | undefined): string[] => {
  if (!Array.isArray(paths)) return [];
  return paths
    .map(resolveMediaUrl)
    .filter((url): url is string => Boolean(url));
};

/**
 * Returns the first valid resolved URL from an image field or images array.
 * Useful for card thumbnails.
 */
export const resolveFirstMediaUrl = (
  primary?: string | null,
  fallbacks?: (string | null | undefined)[]
): string | undefined => {
  const resolved = resolveMediaUrl(primary);
  if (resolved) return resolved;

  if (Array.isArray(fallbacks)) {
    for (const f of fallbacks) {
      const r = resolveMediaUrl(f);
      if (r) return r;
    }
  }
  return undefined;
};
