import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Presentation } from "@/types/PresentationTypes";
import { PresentationsList } from "./PresentationsList";

describe("PresentationsList", () => {
  it("shows only commercialised presentations and preserves their details", async () => {
    const presentation = {
      cis: "69174918",
      cip13: "3400930243404",
      name: "",
      commercialStatus: "commercialised",
      commercialisationEndDate: null,
      administrativeStatus: "abrogated",
      administrativeStatusDate: new Date("2024-12-12T00:00:00Z"),
      details: [
        { codecip13: "3400930243404", nom_presentation: "", numelement: 1, nomelement: "", recipient: "flacon(s)", numrecipient: 1, nbrrecipient: 4, qtecontenance: 0, unitecontenance: "", caraccomplrecip: "", numordreedit: 0, numdispositif: 0, dispositif: "" },
        { codecip13: "3400930243404", nom_presentation: "", numelement: 2, nomelement: "", recipient: "seringue(s) préremplie(s)", numrecipient: 2, nbrrecipient: 4, qtecontenance: 0, unitecontenance: "", caraccomplrecip: "", numordreedit: 0, numdispositif: 0, dispositif: "" },
      ],
    } as Presentation;

    const stopped = {
      ...presentation,
      cip13: "3400934125591",
      administrativeStatus: "active",
      administrativeStatusDate: null,
      commercialStatus: "stopped",
      commercialisationEndDate: new Date("2024-12-12T00:00:00Z"),
      details: [],
    } as Presentation;

    render(<PresentationsList presentations={[presentation, stopped]} />);

    expect(await screen.findByText("Abrogée (12/12/2024)")).not.toBeNull();
    expect(screen.queryByText(/Commercialisation arrêtée/)).toBeNull();
    expect(screen.getByText("4 flacons").parentElement?.parentElement?.textContent)
      .toBe("4 flacons - 4 seringues préremplies");
  });
});


it("does not show prices for stopped or unknown presentations", async () => {
  const stopped: Presentation = {
    cis: "test", cip13: "1", cip7: null, name: "Stopped packaging", commercialStatus: "stopped",
    commercialisationDate: null, commercialisationEndDate: null,
    administrativeStatus: "unknown", administrativeStatusDate: null,
    pricingKnown: false, retailPrice: null, priceExcludingDispensingFee: null,
    dispensingFee: null, reimbursementRate: null, communityApproval: null,
    communityApprovalDate: null, additionalList: null, retrocessionList: null, ivgPricing: null, details: [],
  };
  render(<PresentationsList presentations={[stopped, {...stopped, cip13: "2", commercialStatus: "unknown", name: "Unknown packaging"}]} />);
  expect(await screen.findByText("Aucune présentation commercialisée.")).not.toBeNull();
  expect(screen.queryByText("Stopped packaging")).toBeNull();
  expect(screen.queryByText("Unknown packaging")).toBeNull();
});
