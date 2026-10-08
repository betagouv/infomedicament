import { describe, expect, it, vi } from "vitest";
import { getFicheInfos } from "./ficheInfos";

const opinionDates = ["23/05/2012", "29/04/2015", "03/10/2018", "24/06/2020"];
const documentDates = [
  "12/10/2016", "24/02/2016", "19/04/2023", "12/02/2015", "19/10/2022", "28/05/2025",
];

vi.mock("@/db", () => ({
  default: {
    selectFrom: (table: string) => {
      const rows = table === "has_smr" || table === "has_asmr"
        ? opinionDates.map((date) => ({
            date_avis_definitif: date,
            valeur_smr: "Important",
            valeur_asmr: "V",
            motif_demande: "Réévaluation",
            libelle_smr: `SMR ${date}`,
            libelle_asmr: `ASMR ${date}`,
            url: `https://www.has-sante.fr/avis/${date}`,
          }))
        : table === "has_documents_bon_usage"
          ? documentDates.map((date) => ({
              date_mise_a_jour: date,
              type_document: "Bon usage",
              titre: `Document ${date}`,
              url: `https://www.has-sante.fr/document/${date}`,
            }))
          : [];
      const query = {
        leftJoin: () => query,
        where: () => query,
        select: () => query,
        selectAll: () => query,
        distinct: () => query,
        // Model the database's descending order of DD/MM/YYYY text.
        orderBy: () => {
          rows.sort((a, b) => ("date_avis_definitif" in b ? b.date_avis_definitif : "")
            .localeCompare("date_avis_definitif" in a ? a.date_avis_definitif : ""));
          return query;
        },
        execute: async () => rows,
      };
      return query;
    },
  },
}));
vi.mock("./safety", () => ({
  getImportantInformationEvents: async () => [],
  getReinforcedSurveillanceEvents: async () => [],
}));
vi.mock("./composants", () => ({ getComposants: async () => [] }));

describe("HAS dates in getFicheInfos", () => {
  it("parses French opinion dates and returns both histories newest first with their content and links", async () => {
    const fiche = await getFicheInfos("67613291");
    for (const [history, prefix] of [[fiche?.listeSMR, "SMR"], [fiche?.listeASMR, "ASMR"]] as const) {
      expect(history?.map((entry) => entry.opinionDate)).toEqual([
        "2020-06-24", "2018-10-03", "2015-04-29", "2012-05-23",
      ]);
      expect(history?.map((entry) => [entry.evaluationReason, entry.opinionSummary, entry.hasUrl])).toEqual(
        [...opinionDates].reverse().map((date) => [
          "Réévaluation", `${prefix} ${date}`, `https://www.has-sante.fr/avis/${date}`,
        ]),
      );
    }
  });

  it("keeps good-use dates correct and serializable, including days above 12 and ambiguous dates", async () => {
    const fiche = await getFicheInfos("67613291");
    const serialized = JSON.parse(JSON.stringify(fiche));
    expect(serialized.listeDocumentsBonUsage.map((document: { updatedAt: string }) => document.updatedAt)).toEqual([
      "2016-10-12T00:00:00.000Z", "2016-02-24T00:00:00.000Z", "2023-04-19T00:00:00.000Z",
      "2015-02-12T00:00:00.000Z", "2022-10-19T00:00:00.000Z", "2025-05-28T00:00:00.000Z",
    ]);
  });
});
