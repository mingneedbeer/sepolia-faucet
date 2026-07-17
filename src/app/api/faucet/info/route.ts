import { NextResponse } from "next/server";
import { getFaucetBalance, getFaucetAddress } from "@/lib/faucet";
import { getDailyCapInfo } from "@/lib/rate-limit";

export async function GET() {
  try {
    const [balance, address] = await Promise.all([
      getFaucetBalance(),
      getFaucetAddress(),
    ]);
    const cap = getDailyCapInfo();
    return NextResponse.json({
      balance,
      address,
      network: "Ethereum Sepolia",
      chainId: 11155111,
      dailyUsed: cap.used,
      dailyCap: cap.cap,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch faucet info" }, { status: 500 });
  }
}
