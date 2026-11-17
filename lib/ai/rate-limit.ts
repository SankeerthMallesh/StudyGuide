type Entry = { count: number; resetAt: number };

const windows = new Map<string, Entry>();
const WINDOW_MS = 60_000;
const LIMIT = 10;

/** Best-effort per-instance guard. Use a shared limiter at the edge for multi-instance production. */
export function checkAiRateLimit(request: Request): { allowed: boolean; retryAfterSeconds: number } {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const current = windows.get(address);
  if (!current || current.resetAt <= now) {
    windows.set(address, { count: 1, resetAt: now + WINDOW_MS });
    if (windows.size > 5_000) {
      for (const [key, value] of windows) if (value.resetAt <= now) windows.delete(key);
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= LIMIT) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
