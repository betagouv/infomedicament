import { describe, it, expect } from "vitest";
import { buildExportCsv } from "./export";
import { ExportSpecs } from "@/types/ExportTypes";

const spec: ExportSpecs = {
  specId: "60035714",
  specName: "SIMPONI 50 mg, solution injectable",
  groupName: "SIMPONI",
  composants: "GOLIMUMAB",
  subsIds: [],
  indicationsIds: [],
  indicationsIdsNames: [],
  atc1Code: "L",
  atc2Code: "L04",
  atc5Code: "L04AB06",
  ProcId: "CENTRALISEE",
  isSurveillanceRenforcee: false,
  StatutBdm: 1,
  isAlertPregnancyPlan: false,
  isAlertPregnancyMention: false,
  isAlertPediatricContraindication: false,
};

describe("buildExportCsv", () => {
  it("builds a header and one row per specialite", () => {
    const csv = buildExportCsv([spec, { ...spec, specId: "60000001" }], ["specId", "composants"]);
    expect(csv).toBe([
      '"CIS";"Substances actives"',
      '"60035714";"GOLIMUMAB"',
      '"60000001";"GOLIMUMAB"',
    ].join("\n"));
  });

  it("keeps the fields definition order, not the selection order", () => {
    const csv = buildExportCsv([spec], ["composants", "specId"]);
    expect(csv.split("\n")[0]).toBe('"CIS";"Substances actives"');
  });

  it("escapes double quotes and keeps separators inside values", () => {
    const csv = buildExportCsv([{ ...spec, specName: 'Nom "spécial"; avec ;' }], ["specName"]);
    expect(csv.split("\n")[1]).toBe('"Nom ""spécial""; avec ;"');
  });

  it("returns only the header when there are no results", () => {
    expect(buildExportCsv([], ["specId"])).toBe('"CIS"');
  });
});
