/** Pure validation helpers shared by the UI, private file route, and tests. */
export const PRIVACY_VERSION = '2026-09-24';
export const STUDENT_BUCKETS = ['photos', 'resume-assets', 'resumes', 'roadmaps'] as const;
export type StudentBucket = typeof STUDENT_BUCKETS[number];
export interface StudentAsset { bucket: StudentBucket; path: string }

export function validAsset(bucket: string, path: string): StudentAsset | null {
  if (!(STUDENT_BUCKETS as readonly string[]).includes(bucket)) return null;
  if (!path || path.length > 1024 || /[\\\x00-\x1f%?#]/.test(path)) return null;
  if (path.split('/').some(part => !part || part === '.' || part === '..')) return null;
  return { bucket: bucket as StudentBucket, path };
}

export function privateAssetPath(bucket: string, path: string): string {
  if (!validAsset(bucket, path)) throw new Error('Invalid private asset');
  return `/api/private-file?${new URLSearchParams({ bucket, path })}`;
}

/** Convert legacy storage links without issuing a fetch or trusting another host. */
export function privateAssetUrl(source: string | null | undefined): string {
  if (!source) return '';
  if (source.startsWith('/api/private-file?')) return source;
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return source;
    const url = new URL(source);
    if (url.origin !== new URL(base).origin || url.username || url.password) return source;
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return source;
    const asset = validAsset(decodeURIComponent(match[1]), decodeURIComponent(match[2]));
    return asset ? privateAssetPath(asset.bucket, asset.path) : '';
  } catch { return source; }
}

export function recentSignIn(lastSignIn: string | undefined, now = Date.now()): boolean {
  if (!lastSignIn) return false;
  const age = now - Date.parse(lastSignIn);
  return Number.isFinite(age) && age >= 0 && age <= 10 * 60 * 1000;
}

export function sameOriginWrite(origin: string | null, requestUrl: string): boolean {
  if (!origin || origin === 'null') return false;
  try { return origin === new URL(requestUrl).origin; } catch { return false; }
}
