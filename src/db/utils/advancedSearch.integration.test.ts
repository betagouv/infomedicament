import { describe, expect, it, vi } from "vitest";
import { sql } from "kysely";
import db from "@/db";
import { getAdvancedSearchResults } from "./advancedSearch";
import { initialAdvancedCriteria } from "@/utils/advancedSearch";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("server-only", () => ({}));
vi.mock("./searchSynonyms", () => ({
  getSynonymMap: vi.fn(() => {
    throw new Error("Advanced search must not load synonyms");
  }),
}));

describe("advanced search on the complete catalogue", () => {
  it("combines constraints on the correct records, including historical medicines absent from summaries", async () => {
    const rollback = new Error("rollback test fixtures");
    await db
      .transaction()
      .execute(async (trx) => {
        await sql`insert into ansm_specialite (cis,denomination,statut_amm,disponibilite,date_amm) values
        ('99999111','ZZADVTEST Alpha','ACTIVE','DISPONIBLE','2020-01-01'),
        ('99999112','ZZADVTEST Beta','ABROGEE','INDISPONIBLE','2024-12-31'),
        ('99999113','ZZADVTEST Gamma','ARCHIVEE','INDISPONIBLE','1990-01-01')`.execute(
          trx,
        );
        await sql`insert into ansm_composant (cis,numero_element,numero_composant,substance,nature) values
        ('99999111',1,1,'Paracétamol','Substance active'),('99999112',1,1,'Paracétamol','Substance active'),('99999113',1,1,'Ibuprofène','Substance active')`.execute(
          trx,
        );
        // A conflicting summary must have no effect on the source-backed result.
        await sql`insert into resume_specialites ("specId","specName","groupName",composants,"subsIds","indicationsIds","indicationsIdsNames")
          values ('99999111','STALE SUMMARY NAME','STALE','Ibuprofène','{}','{}','{}')`.execute(
          trx,
        );
        await sql`update ansm_composant set code_substance = '99991' where cis = '99999111'`.execute(
          trx,
        );
        await sql`insert into ansm_substance_nom (code_substance,code_nom,nom,type)
          values ('99991','99991','ZZADVTESTAlias','SYNONYME')`.execute(trx);
        await sql`insert into ansm_specialite_titulaire (cis,code_titulaire,raison_sociale) values
        ('99999111','ZZADVTEST','Laboratoire Exemple'),('99999112','ZZADVTEST','Laboratoire Exemple'),('99999113','ZZADVTEST','Autre laboratoire')`.execute(
          trx,
        );
        await sql`insert into ansm_presentation (cip,cis,denomination,statut_commercialisation) values
        ('9999999999911','99999111','Boîte de 16','COMMERCIALISEE'),('9999999999912','99999111','Boîte de 8','ARRETEE'),
        ('9999999999913','99999112','Boîte de 16','ARRETEE')`.execute(trx);
        await sql`insert into ansm_document (cis,type,date_modification) values
        ('99999111','rcp','2010-01-01'),('99999111','notice','2025-01-01'),('99999112','rcp','2025-01-01')`.execute(
          trx,
        );
        const find = (criteria = {}, search = "") =>
          getAdvancedSearchResults(
            search,
            {
              ...initialAdvancedCriteria,
              specialty: "ZZADVTEST",
              specialtyMatch: "startsWith",
              ...criteria,
            },
            trx,
          );
        const all = await find();
        expect(all.map((s) => s.specId)).toEqual([
          "99999111",
          "99999112",
          "99999113",
        ]);
        expect(all.find((s) => s.specId === "99999112")?.isHistorical).toBe(
          true,
        );
        expect(all.find((s) => s.specId === "99999112")?.composants).toBe(
          "Paracétamol",
        );
        expect(all.find((s) => s.specId === "99999111")?.specName).toBe(
          "ZZADVTEST Alpha",
        );
        expect(all.find((s) => s.specId === "99999111")?.composants).toBe(
          "Paracétamol",
        );
        expect(
          all.find((s) => s.specId === "99999111")?.advancedDetails,
        ).toEqual({
          authorizationStatus: "Valide",
          authorizationDate: "2020-01-01",
          commercialisation: "Commercialisée",
          hasRcp: true,
          rcpUpdatedAt: "2010-01-01",
        });
        expect(
          all.find((s) => s.specId === "99999112")?.advancedDetails,
        ).toEqual({
          authorizationStatus: "Abrogée",
          authorizationDate: "2024-12-31",
          commercialisation: "Arrêtée",
          hasRcp: true,
          rcpUpdatedAt: "2025-01-01",
        });
        expect(
          all.find((s) => s.specId === "99999113")?.advancedDetails,
        ).toEqual({
          authorizationStatus: "Archivée",
          authorizationDate: "1990-01-01",
          commercialisation: "Non renseignée",
          hasRcp: false,
          rcpUpdatedAt: null,
        });
        expect(
          (
            await find({
              substance: "paracetamol",
              holder: "exemple",
              holderMatch: "contains",
            })
          ).map((s) => s.specId),
        ).toEqual(["99999111", "99999112"]);
        expect(
          await find({ substance: "racetamol", substanceMatch: "startsWith" }),
        ).toHaveLength(0);
        expect(
          (await find({ marketingStatus: "Commercialisée" })).map(
            (s) => s.specId,
          ),
        ).toEqual(["99999111"]);
        expect(
          (await find({ marketingStatus: "Arrêtée" })).map((s) => s.specId),
        ).toEqual(["99999111", "99999112"]);
        expect(
          (await find({ documentType: "rcp", documentFrom: "2025-01-01" })).map(
            (s) => s.specId,
          ),
        ).toEqual(["99999112"]);
        expect(await find({ documentTo: "2025-01-01" })).toHaveLength(2);
        expect(
          (
            await find({
              authorizationFrom: "2024-12-31",
              authorizationTo: "2024-12-31",
            })
          ).map((s) => s.specId),
        ).toEqual(["99999112"]);
        expect(
          (await find({ authorizationStatus: "Archivée" })).map(
            (s) => s.specId,
          ),
        ).toEqual(["99999113"]);
        expect(await find({ holder: "%" })).toHaveLength(0);
        expect((await find({}, "paracetamol")).map((s) => s.specId)).toEqual([
          "99999111",
          "99999112",
        ]);
        expect(await find({}, "paracetmol")).toHaveLength(0);
        expect(await find({}, "paracetamol%")).toHaveLength(0);
        expect(await find({}, "Alpha ZZADVTEST")).toHaveLength(0);
        expect(
          (await find({}, "ZZADVTEST Alpha")).map((s) => s.specId),
        ).toEqual(["99999111"]);
        expect(await find({}, "mol")).toHaveLength(2);
        expect(await find({}, "ZZADVTESTAlias")).toHaveLength(0);
        expect(await find({ substance: "ZZADVTESTAlias" })).toHaveLength(0);
        throw rollback;
      })
      .catch((error) => {
        if (error !== rollback) throw error;
      });
    expect(
      await db
        .selectFrom("ansm_specialite")
        .where("cis", "in", ["99999111", "99999112", "99999113"])
        .select("cis")
        .execute(),
    ).toEqual([]);
  });
});
