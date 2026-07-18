import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
}));

vi.mock("@libsql/client", () => ({
  createClient: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

const mockExecute = vi.fn();

vi.mocked((await import("@libsql/client")).createClient as any).mockReturnValue({
  execute: mockExecute,
});

describe("db", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TURSO_DATABASE_URL = "libsql://test.turso.io";
    process.env.TURSO_AUTH_TOKEN = "test-token";
  });

  it("getDailyCapInfo returns correct used and cap", async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ count: 1 }] });

    const { getDailyCapInfo } = await import("@/lib/db");
    const result = await getDailyCapInfo();

    expect(result.cap).toBe(0.02);
    expect(result.used).toBe(0.01);
  });
});
