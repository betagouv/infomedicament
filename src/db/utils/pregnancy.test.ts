import { describe, expect, it } from "vitest";
import type { PregnancyAlert } from "@/types/PregancyTypes";
import { findPregnancyPlanAlert } from "./pregnancyCatalog";

const alerts: PregnancyAlert[] = [
  { id: "", link: "" },
  { id: "6197", link: "https://example.test/triptoreline" },
];

describe("pregnancy-plan substance matching", () => {
  it("matches equivalent padded substance identifiers", () => {
    expect(findPregnancyPlanAlert(["06197"], alerts)).toEqual(alerts[1]);
  });

  it("does not match an inactive-substance placeholder to a null reference", () => {
    expect(findPregnancyPlanAlert(["00000"], alerts)).toBeUndefined();
  });

  it("ignores empty and non-numeric identifiers", () => {
    expect(findPregnancyPlanAlert(["", "not-an-id"], alerts)).toBeUndefined();
  });
});
