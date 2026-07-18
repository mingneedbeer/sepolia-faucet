import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { log } from "@/lib/logger";

const FAUCET_AMOUNT = import.meta.env.FAUCET_AMOUNT || "0.01";
const RPC_URL = import.meta.env.RPC_URL || "https://ethereum-sepolia.publicnode.com";

let cached: {
  account: ReturnType<typeof privateKeyToAccount>;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
} | null = null;

function getFaucet() {
  if (cached) return cached;

  const pk = import.meta.env.FAUCET_PRIVATE_KEY;
  if (!pk) throw new Error("FAUCET_PRIVATE_KEY not set");

  const normalized = pk.startsWith("0x") ? pk : `0x${pk}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("FAUCET_PRIVATE_KEY must be a 0x-prefixed 64-character hex string");
  }

  const account = privateKeyToAccount(normalized as `0x${string}`);
  const transport = http(RPC_URL);
  const publicClient = createPublicClient({ chain: sepolia, transport });
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  log("info", "Faucet initialized", { address: account.address });

  cached = { account, publicClient, walletClient };
  return cached;
}

export async function getFaucetBalance(): Promise<string> {
  try {
    const { account, publicClient } = getFaucet();
    const balance = await publicClient.getBalance({ address: account.address });
    return formatEther(balance);
  } catch (err) {
    log("error", "Failed to fetch faucet balance", { error: err instanceof Error ? err.message : String(err) });
    return "0";
  }
}

export async function getFaucetAddress(): Promise<string> {
  const { account } = getFaucet();
  return account.address;
}

export async function sendSepolia(to: `0x${string}`): Promise<{ hash?: string; error?: string }> {
  try {
    const { account, walletClient } = getFaucet();
    const hash = await walletClient.sendTransaction({
      account,
      chain: sepolia,
      to,
      value: parseEther(FAUCET_AMOUNT),
    });
    log("info", "Transaction sent", { to, hash, amount: FAUCET_AMOUNT });
    return { hash };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transaction failed";
    log("error", "Transaction failed", { to, error: msg });
    return { error: msg };
  }
}
