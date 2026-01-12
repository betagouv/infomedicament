// src/backend/sanity.test.ts
import { describe, it, expect } from "vitest";

describe("Sanity Check", () => {
  it("should verify that tests run (if this fails, something is very wrong)", () => {
    const a = 1;
    const b = 1;
    expect(a + b).toBe(2);
  });
});
