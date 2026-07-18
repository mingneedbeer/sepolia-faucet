import { describe, it, expect, vi, beforeEach } from "vitest";
import { log } from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  log: vi.fn(),
}));

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs info level to console.log", () => {
    log("info", "test message", { key: "value" });
    expect(console.log).toHaveBeenCalled();
    const output = JSON.parse((console.log as any).mock.calls[0][0]);
    expect(output.level).toBe("info");
    expect(output.msg).toBe("test message");
    expect(output.key).toBe("value");
    expect(output.ts).toBeDefined();
  });

  it("logs warn level to console.warn", () => {
    log("warn", "warning message");
    expect(console.warn).toHaveBeenCalled();
    const output = JSON.parse((console.warn as any).mock.calls[0][0]);
    expect(output.level).toBe("warn");
    expect(output.msg).toBe("warning message");
  });

  it("logs error level to console.error", () => {
    log("error", "error message", { code: 500 });
    expect(console.error).toHaveBeenCalled();
    const output = JSON.parse((console.error as any).mock.calls[0][0]);
    expect(output.level).toBe("error");
    expect(output.code).toBe(500);
  });
});
