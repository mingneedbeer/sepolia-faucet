import { createPublicClient, createWalletClient, http, parseEther, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || "0.01";
const RPC_URL = process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com";

function getFaucetAccount() {
  const pk = process.env.FAUCET_PRIVATE_KEY;
  if (!pk) throw new Error("FAUCET_PRIVATE_KEY not set");
  const key = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
  return privateKeyToAccount(key);
}

function getClients() {
  const account = getFaucetAccount();
  const transport = http(RPC_URL);

  return {
    account,
    publicClient: createPublicClient({ chain: sepolia, transport }),
    walletClient: createWalletClient({ account, chain: sepolia, transport }),
  };
}

export async function getFaucetBalance(): Promise<string> {
  try {
    const { account, publicClient } = getClients();
    const balance = await publicClient.getBalance({ address: account.address });
    return formatEther(balance);
  } catch {
    return "0";
  }
}

export async function getFaucetAddress(): Promise<string> {
  try {
    const { account } = getClients();
    return account.address;
  } catch {
    return "";
  }
}

export async function sendSepolia(to: `0x${string}`): Promise<{ hash?: string; error?: string }> {
  try {
    const { walletClient } = getClients();
    const hash = await walletClient.sendTransaction({
      to,
      value: parseEther(FAUCET_AMOUNT),
    });
    return { hash };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Transaction failed" };
  }
}
