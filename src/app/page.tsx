import { fr } from "@codegouvfr/react-dsfr";
import { cache } from "react";

import { db } from "@/database";

export default async function Home() {
  return <h1 className={fr.cx("fr-h2")}>Page d&apos;accueil</h1>;
}
