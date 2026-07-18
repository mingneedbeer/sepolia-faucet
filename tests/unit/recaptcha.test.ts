import { describe, it, expect, vi, beforeEach } from "vitest";

describe("recaptcha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RECAPTCHA_SECRET_KEY;
  });

  it("returns true when no secret key is set (dev mode)", async () => {
    const { verifyRecaptcha } = await import("@/lib/recaptcha");
    const result = await verifyRecaptcha("fake-token");
    expect(result).toBe(true);
  });

  it("verifies token with Google API", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    const { verifyRecaptcha } = await import("@/lib/recaptcha");
    const result = await verifyRecaptcha("valid-token");
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://www.google.com/recaptcha/api/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns false when verification fails", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false }),
    });

    const { verifyRecaptcha } = await import("@/lib/recaptcha");
    const result = await verifyRecaptcha("invalid-token");
    expect(result).toBe(false);
  });

  it("returns false on network error", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { verifyRecaptcha } = await import("@/lib/recaptcha");
    const result = await verifyRecaptcha("token");
    expect(result).toBe(false);
  });
});
