import type { APIRoute } from "astro";
import { isAddress } from "viem";
import { sendSepolia } from "@/lib/faucet";
import { checkAddressCooldown, recordClaim, revertClaim, getDailyCapInfo } from "@/lib/db";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { log } from "@/lib/logger";

const MAX_BODY_BYTES = 4096;
const FAUCET_AMOUNT = import.meta.env.FAUCET_AMOUNT || "0.01";

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { address, recaptchaToken } = (await request.json()) as {
      address?: string;
      recaptchaToken?: string;
    };

    if (!address || !isAddress(address)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
      log("warn", "reCAPTCHA failed", { address });
      return new Response(JSON.stringify({ error: "reCAPTCHA verification failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cooldown = await checkAddressCooldown(address);
    if (!cooldown.allowed) {
      const hours = Math.ceil(cooldown.remainingMs / 3600000);
      return new Response(
        JSON.stringify({ error: `Please wait ${hours}h before your next claim` }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const dailyCap = await getDailyCapInfo();
    if (dailyCap.used >= dailyCap.cap) {
      return new Response(
        JSON.stringify({
          error: `Daily faucet cap reached (${dailyCap.used}/${dailyCap.cap} ETH). Try again tomorrow.`,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await sendSepolia(address as `0x${string}`);
    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await recordClaim(address, result.hash!, FAUCET_AMOUNT);

    return new Response(JSON.stringify({ success: true, hash: result.hash }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log("error", "Claim handler error", { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
