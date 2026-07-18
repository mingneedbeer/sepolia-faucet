import { createClient } from "@libsql/client";

let client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (client) return client;

  const url = import.meta.env.TURSO_DATABASE_URL;
  const authToken = import.meta.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL not set");
  }

  client = createClient({ url, authToken: authToken ?? undefined });
  return client;
}

export async function checkAddressCooldown(
  address: string
): Promise<{ allowed: boolean; remainingMs: number }> {
  const db = getDb();
  const cooldownMs = 24 * 60 * 60 * 1000;

  const result = await db.execute({
    sql: "SELECT created_at FROM claims WHERE address = ? ORDER BY created_at DESC LIMIT 1",
    args: [address.toLowerCase()],
  });

  if (result.rows.length === 0) {
    return { allowed: true, remainingMs: 0 };
  }

  const lastClaim = new Date(result.rows[0].created_at as string).getTime();
  const elapsed = Date.now() - lastClaim;

  if (elapsed >= cooldownMs) {
    return { allowed: true, remainingMs: 0 };
  }

  return { allowed: false, remainingMs: cooldownMs - elapsed };
}

export async function recordClaim(
  address: string,
  txHash: string,
  amount: string
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO claims (address, tx_hash, amount) VALUES (?, ?, ?)",
    args: [address.toLowerCase(), txHash, amount],
  });
}

export async function revertClaim(address: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM claims WHERE address = ? AND id = (SELECT id FROM claims WHERE address = ? ORDER BY created_at DESC LIMIT 1)",
    args: [address.toLowerCase(), address.toLowerCase()],
  });
}

export async function getDailyCapInfo(): Promise<{
  used: number;
  cap: number;
}> {
  const db = getDb();
  const capEth = parseFloat(import.meta.env.DAILY_CAP || "0.02");
  const faucetAmount = parseFloat(import.meta.env.FAUCET_AMOUNT || "0.01");
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const result = await db.execute({
    sql: "SELECT COUNT(*) as count FROM claims WHERE created_at >= ?",
    args: [windowStart],
  });

  const count = Number(result.rows[0].count);
  return { used: count * faucetAmount, cap: capEth };
}
