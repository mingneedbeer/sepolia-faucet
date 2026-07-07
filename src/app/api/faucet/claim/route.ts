import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { sendSepolia } from "@/lib/faucet";
import { checkRateLimit, setRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { address } = (await req.json()) as { address?: string };

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const { allowed, remainingMs } = checkRateLimit(address);
    if (!allowed) {
      const hours = Math.ceil(remainingMs / 3600000);
      return NextResponse.json(
        { error: `Please wait ${hours}h before your next claim` },
        { status: 429 }
      );
    }

    const result = await sendSepolia(address);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    setRateLimit(address);

    return NextResponse.json({
      success: true,
      hash: result.hash,
      message: `Successfully sent! Tx: ${result.hash?.slice(0, 10)}...`,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
