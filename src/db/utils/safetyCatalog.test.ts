import { describe, expect, it } from "vitest";
import { mapAnsmSafetyEvent } from "./safetyCatalog";

describe("mapAnsmSafetyEvent", () => {
  it("preserves event identity, dates, expiry, label, and comment", () => {
    const event = mapAnsmSafetyEvent({
      cis: "60035714",
      code_evenement: 83,
      num_evenement: 2,
      evenement: "Médicament soumis à une surveillance renforcée (triangle noir)",
      date_evenement: new Date("2024-01-01"),
      date_echeance: new Date("2029-01-01"),
      commentaire: "Information ANSM",
      date_modification: new Date("2024-02-01"),
    });

    expect(event).toEqual({
      specialiteId: "60035714",
      code: 83,
      sequence: 2,
      typeLabel: "Médicament soumis à une surveillance renforcée (triangle noir)",
      eventDate: new Date("2024-01-01"),
      expiryDate: new Date("2029-01-01"),
      comment: "Information ANSM",
      modifiedAt: new Date("2024-02-01"),
    });
  });
});
