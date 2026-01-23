import { describe, it, expect, beforeEach, vi } from "vitest";
import { isRateLimited } from "../utils/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should allow requests under the limit", () => {
    const result = isRateLimited("test-ip-1", 5, 60000);

    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(4);
  });

  it("should track remaining requests correctly", () => {
    const ip = "test-ip-2";
    const limit = 5;

    expect(isRateLimited(ip, limit, 60000).remaining).toBe(4);
    expect(isRateLimited(ip, limit, 60000).remaining).toBe(3);
    expect(isRateLimited(ip, limit, 60000).remaining).toBe(2);
    expect(isRateLimited(ip, limit, 60000).remaining).toBe(1);
    expect(isRateLimited(ip, limit, 60000).remaining).toBe(0);
  });

  it("should block requests over the limit", () => {
    const ip = "test-ip-3";
    const limit = 3;

    isRateLimited(ip, limit, 60000);
    isRateLimited(ip, limit, 60000);
    isRateLimited(ip, limit, 60000);

    const result = isRateLimited(ip, limit, 60000);

    expect(result.limited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should reset after window expires", () => {
    const ip = "test-ip-4";
    const limit = 2;
    const windowMs = 60000;

    isRateLimited(ip, limit, windowMs);
    isRateLimited(ip, limit, windowMs);

    expect(isRateLimited(ip, limit, windowMs).limited).toBe(true);

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1);

    const result = isRateLimited(ip, limit, windowMs);
    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(1);
  });

  it("should track different IPs independently", () => {
    const limit = 2;

    isRateLimited("ip-a", limit, 60000);
    isRateLimited("ip-a", limit, 60000);
    isRateLimited("ip-b", limit, 60000);

    expect(isRateLimited("ip-a", limit, 60000).limited).toBe(true);
    expect(isRateLimited("ip-b", limit, 60000).limited).toBe(false);
  });
});
