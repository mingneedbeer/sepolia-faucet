import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { sendSepolia } from "@/lib/faucet";
import { checkAddressRateLimit, setAddressRateLimit, checkDailyCap, logDailyDispense } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

const FAUCET_AMOUNT = process.env.FAUCET_AMOUNT || "0.01";

export async function POST(req: NextRequest) {
  try {
    const { address, recaptchaToken } = (await req.json()) as {
      address?: string;
      recaptchaToken?: string;
    };

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: "reCAPTCHA verification failed" }, { status: 400 });
    }

    const { allowed, remainingMs } = checkAddressRateLimit(address);
    if (!allowed) {
      const hours = Math.ceil(remainingMs / 3600000);
      return NextResponse.json(
        { error: `Please wait ${hours}h before your next claim` },
        { status: 429 }
      );
    }

    const amountEth = parseFloat(FAUCET_AMOUNT);
    const cap = checkDailyCap(amountEth);
    if (!cap.allowed) {
      return NextResponse.json(
        { error: `Daily faucet cap reached (${cap.used}/${cap.cap} ETH). Try again tomorrow.` },
        { status: 429 }
      );
    }

    const result = await sendSepolia(address);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    setAddressRateLimit(address);
    logDailyDispense();

    return NextResponse.json({
      success: true,
      hash: result.hash,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
