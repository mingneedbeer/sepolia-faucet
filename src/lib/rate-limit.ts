import { log } from "@/lib/logger";

const requestMap = new Map<string, number>();
const dailyLedger: number[] = [];

const ADDRESS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_CAP_ETH = parseFloat(process.env.DAILY_CAP || "0.02");

function trimDailyLedger(): void {
  const windowStart = Date.now() - ADDRESS_COOLDOWN_MS;
  const recent = dailyLedger.filter((ts) => ts >= windowStart);
  dailyLedger.length = 0;
  dailyLedger.push(...recent);
}

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

export function tryReserve(address: string, amountEth: number): {
  allowed: boolean;
  remainingMs?: number;
  used?: number;
  cap?: number;
} {
  const addrCheck = checkAddressRateLimit(address);
  if (!addrCheck.allowed) {
    return { allowed: false, remainingMs: addrCheck.remainingMs };
  }

  trimDailyLedger();
  const used = dailyLedger.length * amountEth;
  if (used >= DAILY_CAP_ETH) {
    return { allowed: false, used, cap: DAILY_CAP_ETH };
  }

  dailyLedger.push(Date.now());
  requestMap.set(address.toLowerCase(), Date.now());

  log("info", "Rate limit reserved", { address, amountEth, dailyUsed: used + amountEth });
  return { allowed: true };
}

export function revertReserve(address: string): void {
  dailyLedger.pop();
  requestMap.delete(address.toLowerCase());
  log("info", "Rate limit reverted", { address });
}

export function getDailyCapInfo(): { used: number; cap: number } {
  trimDailyLedger();
  return { used: dailyLedger.length * parseFloat(process.env.FAUCET_AMOUNT || "0.01"), cap: DAILY_CAP_ETH };
}
