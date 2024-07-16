import { cache } from "react";
import { fr } from "@codegouvfr/react-dsfr";

import { db } from "@/database";

import liste_CIS_MVP from "./liste_CIS_MVP.json";

export async function generateStaticParams(): Promise<{ CIS: string }[]> {
  return liste_CIS_MVP.map((CIS) => ({
    CIS,
  }));
}

const getSpecialite = cache(async (CIS: string) => {
  return await db
    .selectFrom("Specialite")
    .where("SpecId", "=", CIS)
    .selectAll()
    .executeTakeFirstOrThrow();
});

export default async function Home({
  params: { CIS },
}: {
  params: { CIS: string };
}) {
  const specialite = await getSpecialite(CIS);

  const denom = specialite.SpecDenom01.split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

  return <h1 className={fr.cx("fr-h2")}>{denom}</h1>;
}
