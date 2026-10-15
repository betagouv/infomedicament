import { expect, it } from "vitest";
import {
  commercialStatusToDisplayStatus,
  getPresentationSourceStatuses,
  mapCommercialStatus,
} from "./presentationCatalog";

it.each([
  ["COMMERCIALISEE", "commercialised", "Commercialisée"],
  ["ARRETEE", "stopped", "Arrêtée"],
  ["SUSPENDUE", "suspended", "Suspendue"],
  ["RETIREE", "withdrawn", "Retirée"],
] as const)(
  "shares display and filter semantics for %s",
  (source, domain, label) => {
    expect(mapCommercialStatus(source)).toBe(domain);
    expect(commercialStatusToDisplayStatus(source)).toBe(label);
    expect(getPresentationSourceStatuses(label)).toEqual([source]);
  },
);

it("keeps unknown, undisclosed and missing commercialisation distinct", () => {
  expect(commercialStatusToDisplayStatus("INCONNUE")).toBe("Inconnue");
  expect(commercialStatusToDisplayStatus("NON_COMMUNIQUEE")).toBe(
    "Non communiquée",
  );
  expect(commercialStatusToDisplayStatus(null)).toBe("Non renseignée");
  expect(mapCommercialStatus(null)).toBe("unknown");
  expect(mapCommercialStatus("unexpected")).toBe("unknown");
  expect(getPresentationSourceStatuses("unexpected")).toEqual([]);
});
