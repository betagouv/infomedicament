import { fr } from "@codegouvfr/react-dsfr";
import { cache } from "react";

import { db } from "@/database";

const getSpecialite = cache(async (id: string) => {
  return await db
    .selectFrom("Specialite")
    .where("SpecId", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow();
});

export default async function Home() {
  const specialite = await getSpecialite("69118175");

  const denom = specialite.SpecDenom01.split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

  return <h1 className={fr.cx("fr-h2")}>{denom}</h1>;
}
