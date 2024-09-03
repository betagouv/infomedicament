import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";

import { pdbmMySQL, Specialite, SubstanceNom } from "@/db/pdbmMySQL";
import { formatSpecName, groupSpecialites } from "@/displayUtils";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return (
    await pdbmMySQL
      .selectFrom("Subs_Nom")
      .leftJoin("Composant", "Subs_Nom.SubsId", "Composant.SubsId")
      .where("Composant.SpecId", "in", liste_CIS_MVP)
      .select("Subs_Nom.NomId as id")
      .distinct()
      .execute()
  ).map(({ id }) => ({ id: id.trim() }));
}

async function getSubstance(id: string) {
  const substance: SubstanceNom = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where("NomId", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow();

  const specialites: Specialite[] = await pdbmMySQL
    .selectFrom("Specialite")
    .innerJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
    .where("Composant.NomId", "=", id)
    .where(({ eb, selectFrom }) =>
      eb(
        "Specialite.SpecId",
        "not in",
        selectFrom("Composant as subquery")
          .select("SpecId")
          .where("subquery.NomId", "!=", id)
          .whereRef("subquery.CompNum", "!=", "Composant.CompNum"),
      ),
    )
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .selectAll("Specialite")
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
          Médicaments contenant uniquement « {substance.NomLib} »
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
