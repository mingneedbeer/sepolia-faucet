import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { sendSepolia } from "@/lib/faucet";
import { tryReserve, revertReserve } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { log } from "@/lib/logger";

const MAX_BODY_BYTES = 1024;
const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || "0.01";

export async function POST(req: NextRequest) {
  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const { address, recaptchaToken } = (await req.json()) as {
      address?: string;
      recaptchaToken?: string;
    };

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
      log("warn", "reCAPTCHA failed", { address });
      return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
    }

    const amountEth = parseFloat(FAUCET_AMOUNT);
    const reserve = tryReserve(address, amountEth);
    if (!reserve.allowed) {
      if (reserve.remainingMs !== undefined) {
        const hours = Math.ceil(reserve.remainingMs / 3600000);
        return NextResponse.json(
          { error: `Please wait ${hours}h before your next claim` },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Daily faucet cap reached (${reserve.used}/${reserve.cap} ETH). Try again tomorrow.` },
        { status: 429 }
      );
    }

    const result = await sendSepolia(address);
    if (result.error) {
      revertReserve(address);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      hash: result.hash,
    });
  } catch (err) {
    log("error", "Claim handler error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
