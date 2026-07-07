import { NextResponse } from "next/server";
import { getFaucetBalance, getFaucetAddress } from "@/lib/faucet";

export async function GET() {
  try {
    const [balance, address] = await Promise.all([
      getFaucetBalance(),
      getFaucetAddress(),
    ]);
    return NextResponse.json({
      balance,
      address,
      network: "Ethereum Sepolia",
      chainId: 11155111,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch faucet info" }, { status: 500 });
  }
}
