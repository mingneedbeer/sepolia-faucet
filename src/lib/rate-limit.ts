const requestMap = new Map<string, number>();

const RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

export function checkRateLimit(address: string): {
  allowed: boolean;
  remainingMs: number;
} {
  const lastClaim = requestMap.get(address.toLowerCase());
  if (!lastClaim) {
    return { allowed: true, remainingMs: 0 };
  }
  const elapsed = Date.now() - lastClaim;
  if (elapsed >= RATE_LIMIT_MS) {
    requestMap.delete(address.toLowerCase());
    return { allowed: true, remainingMs: 0 };
  }
  return { allowed: false, remainingMs: RATE_LIMIT_MS - elapsed };
}

export function setRateLimit(address: string): void {
  requestMap.set(address.toLowerCase(), Date.now());
}
