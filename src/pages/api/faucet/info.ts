import type { APIRoute } from "astro";
import { getFaucetBalance, getFaucetAddress } from "@/lib/faucet";
import { getDailyCapInfo } from "@/lib/db";

export const GET: APIRoute = async () => {
  try {
    const [balance, address] = await Promise.all([
      getFaucetBalance(),
      getFaucetAddress(),
    ]);
    const cap = await getDailyCapInfo();
    return new Response(
      JSON.stringify({
        balance,
        address,
        network: "Ethereum Sepolia",
        chainId: 11155111,
        dailyUsed: cap.used,
        dailyCap: cap.cap,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch faucet info" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
