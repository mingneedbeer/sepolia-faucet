const requestMap = new Map<string, number>();
const dailyLedger: number[] = [];

const ADDRESS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_CAP_ETH = parseFloat(process.env.DAILY_CAP || "0.5");

export function checkAddressRateLimit(address: string): {
  allowed: boolean;
  remainingMs: number;
} {
  const lastClaim = requestMap.get(address.toLowerCase());
  if (!lastClaim) {
    return { allowed: true, remainingMs: 0 };
  }
  const elapsed = Date.now() - lastClaim;
  if (elapsed >= ADDRESS_COOLDOWN_MS) {
    requestMap.delete(address.toLowerCase());
    return { allowed: true, remainingMs: 0 };
  }
  return { allowed: false, remainingMs: ADDRESS_COOLDOWN_MS - elapsed };
}

export function setAddressRateLimit(address: string): void {
  requestMap.set(address.toLowerCase(), Date.now());
}

export function checkDailyCap(amountEth: number): { allowed: boolean; used: number; cap: number } {
  const windowStart = Date.now() - ADDRESS_COOLDOWN_MS;
  const recent = dailyLedger.filter((ts) => ts >= windowStart);
  const used = recent.length * amountEth;
  const cap = DAILY_CAP_ETH;
  return { allowed: used < cap, used, cap };
}

export function logDailyDispense(): void {
  dailyLedger.push(Date.now());
}
