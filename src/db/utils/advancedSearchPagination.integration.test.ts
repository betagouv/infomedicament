import { expect, it, vi } from "vitest";
import { sql } from "kysely";
import db from "@/db";
import { getAdvancedSearchPage } from "./advancedSearch";
import { getAdvancedSearchExport } from "./advancedSearchExport";
import { initialAdvancedCriteria } from "@/utils/advancedSearch";

vi.mock("server-only", () => ({}));

it("paginates beyond 500, exports the whole selection, and applies global facets and procedures", async () => {
  const rollback = new Error("rollback fixtures");
  await expect(
    db.transaction().execute(async (trx) => {
      await sql`insert into ansm_specialite (cis,denomination,statut_amm,disponibilite,procedure)
      select (99997000+n)::text, 'ZZPAGETEST ' || lpad(n::text,3,'0'), 'ACTIVE','INDISPONIBLE', case when n=505 then 'CENTRALISEE' else 'NATIONALE' end
      from generate_series(1,505) n`.execute(trx);
      await sql`insert into ansm_composant (cis,numero_element,numero_composant,substance,nature) values ('99997505',1,1,'ZZPAGETEST Substance','Substance active')`.execute(
        trx,
      );
      await sql`insert into ansm_atc (code,libelle_abr,libelle_long) values (99997001,'N02ZZ91','ZZPAGETEST Classe 1'),(99997002,'N02ZZ92','ZZPAGETEST Classe 2')`.execute(
        trx,
      );
      await sql`insert into ansm_specialite_atc (cis,code_atc) values ('99997505',99997001),('99997505',99997002)`.execute(
        trx,
      );
      await sql`insert into indications (id,nom,"CIS") values (99997001,'ZZPAGETEST Indication',array['99997505']::varchar[])`.execute(
        trx,
      );
      const criteria = { ...initialAdvancedCriteria, specialty: "ZZPAGETEST" };
      const options = {
        page: 1,
        substances: [],
        atcs: [],
        indications: [],
        descending: false,
      };
      expect(
        (await getAdvancedSearchPage("", initialAdvancedCriteria, options, trx))
          .total,
      ).toBe(0);
      expect(
        await getAdvancedSearchExport(initialAdvancedCriteria, options, trx),
      ).toEqual([]);
      const first = await getAdvancedSearchPage("", criteria, options, trx);
      const last = await getAdvancedSearchPage(
        "",
        criteria,
        { ...options, page: 11 },
        trx,
      );
      expect(first.total).toBe(505);
      expect(first.results).toHaveLength(50);
      expect(last.results).toHaveLength(5);
      expect(last.results.at(-1)?.specId).toBe("99997505");
      expect(last.results.at(-1)?.officialAtcs).toEqual([
        { code: "N02ZZ91", label: "ZZPAGETEST Classe 1" },
        { code: "N02ZZ92", label: "ZZPAGETEST Classe 2" },
      ]);
      expect(first.facets.substances).toContainEqual({
        id: "ZZPAGETEST Substance",
        name: "ZZPAGETEST Substance",
        count: 1,
        selected: false,
      });
      expect(
        first.facets.atcs
          .find((a) => a.id === "N")
          ?.children?.find((a) => a.id === "N02")?.count,
      ).toBe(1);
      const filteredOptions = {
        ...options,
        page: 99,
        substances: ["ZZPAGETEST Substance"],
        atcs: ["N02"],
        indications: ["99997001"],
      };
      const filtered = await getAdvancedSearchPage(
        "",
        criteria,
        filteredOptions,
        trx,
      );
      expect(filtered.total).toBe(1);
      expect(first.facets.indications).toContainEqual({
        id: "99997001",
        name: "ZZPAGETEST Indication",
        count: 1,
        selected: false,
      });
      expect(filtered.page).toBe(1);
      const exported = await getAdvancedSearchExport(criteria, options, trx);
      expect(exported).toHaveLength(505);
      expect(exported.at(-1)?.atcs).toHaveLength(2);
      expect(
        (await getAdvancedSearchExport(criteria, filteredOptions, trx)).map(
          (row) => row.cis,
        ),
      ).toEqual(filtered.results.map((row) => row.specId));
      expect(
        (
          await getAdvancedSearchPage(
            "",
            { ...criteria, procedure: "CENTRALISEE" },
            options,
            trx,
          )
        ).results.map((row) => row.specId),
      ).toEqual(["99997505"]);
      throw rollback;
    }),
  ).rejects.toBe(rollback);
});
