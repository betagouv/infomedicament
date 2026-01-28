import { describe, it, expect } from "vitest";
import { getAtcCode, getAtc1Code, getAtc2Code } from "./atc";

describe("atc utils", () => {
  describe("getAtcCode", () => {
    it("should return the correct ATC code for a known CIS", async () => {
      // CIS 63236206 → R03DX09 (Mépolizumab)
      const result = await getAtcCode("63236206");
      expect(result).toBe("R03DX09");
    });

    it("should return the correct ATC code for another known CIS", async () => {
      // CIS 60681425 → A01AA01 (Fluorure de sodium)
      const result = await getAtcCode("60681425");
      expect(result).toBe("A01AA01");
    });

    it("should return undefined for an unknown CIS", async () => {
      const result = await getAtcCode("00000000");
      expect(result).toBeUndefined();
    });
  });

  describe("getAtc1Code", () => {
    it("should return the first character of an ATC code", () => {
      expect(getAtc1Code("R03DX09")).toBe("R");
      expect(getAtc1Code("A01AA01")).toBe("A");
    });
  });

  describe("getAtc2Code", () => {
    it("should return the first 3 characters of an ATC code", () => {
      expect(getAtc2Code("R03DX09")).toBe("R03");
      expect(getAtc2Code("A01AA01")).toBe("A01");
    });
  });
});
