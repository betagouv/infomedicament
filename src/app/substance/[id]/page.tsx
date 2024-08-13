import { pdbmMySQL, Specialite, SubstanceNom } from "@/db/pdbmMySQL";
import { sql } from "kysely";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";
import { formatSpecName, groupSpecialites } from "@/displayUtils";

async function getSubstance(id: string) {
  const substance: SubstanceNom = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where(({ eb, selectFrom }) =>
      eb(
        "NomId",
        "=",
        selectFrom("Subs_Nom as subquery")
          .select("NomId")
          .whereRef("subquery.SubsId", "=", "Subs_Nom.SubsId")
          .orderBy(sql`LENGTH(Subs_Nom.NomLib)`)
          .limit(1),
      ),
    )
    .where("SubsId", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow();

  const specialites: Specialite[] = await pdbmMySQL
    .selectFrom("Specialite")
    .innerJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
    .where("Composant.SubsId", "=", id)
    .selectAll()
    .execute();

  return {
    substance,
    specialites,
  };
}

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const { substance, specialites } = await getSubstance(id);

  return (
    <>
      <Badge className={fr.cx("fr-badge--purple-glycine", "fr-mb-2w")}>
        Page substance active
      </Badge>
      <h1 className={fr.cx("fr-h2", "fr-mb-8w")}>{substance.NomLib}</h1>
      <section className={fr.cx("fr-card", "fr-p-3w")}>
        <Badge className={fr.cx("fr-badge--green-emeraude", "fr-mb-2w")}>
          Médicament
        </Badge>
        <h2 className={fr.cx("fr-h3")}>
          Médicaments contenant « {substance.NomLib} »
        </h2>
        <ul>
          {Array.from(groupSpecialites(specialites).entries()).map(
            ([groupName, specialites]: [string, Specialite[]]) => (
              <li key={groupName} className={"fr-mb-2w"}>
                <b>{formatSpecName(groupName)}</b>
                <ul>
                  {specialites?.map((specialite) => (
                    <li key={specialite.SpecId}>
                      <Link href={`/medicament/${specialite.SpecId}`}>
                        {formatSpecName(specialite.SpecDenom01)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>
      </section>
    </>
  );
}
