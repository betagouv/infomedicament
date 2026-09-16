import { describe, expect, it } from "vitest";
import {
  mapAnsmSafetyEvent,
  mapImportantInformation,
} from "./safetyCatalog";

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

describe("mapImportantInformation", () => {
  it("maps ANSM code 84 comments to the information displayed by the fiche", () => {
    expect(mapImportantInformation({
      specialiteId: "60035714",
      code: 84,
      sequence: 1,
      typeLabel: "Point d'information",
      eventDate: new Date("2026-01-01"),
      expiryDate: null,
      comment: "<p>Information importante</p>",
      modifiedAt: new Date("2026-01-02"),
    })).toEqual({
      html: "<p>Information importante</p>",
      eventDate: new Date("2026-01-01"),
      expiryDate: null,
      typeLabel: "Point d'information",
    });
  });

  it("ignores non-84 events and empty comments", () => {
    const event = {
      specialiteId: "60035714",
      code: 83,
      sequence: 1,
      typeLabel: "Surveillance renforcée",
      eventDate: null,
      expiryDate: null,
      comment: " ",
      modifiedAt: null,
    };

    expect(mapImportantInformation(event)).toBeNull();
    expect(mapImportantInformation({ ...event, code: 84 })).toBeNull();
  });
});
