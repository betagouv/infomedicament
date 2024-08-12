import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { pdbmMySQL, Specialite } from "@/db/pdbmMySQL";
import { fr } from "@codegouvfr/react-dsfr";

import { formatSpecName } from "@/formatUtils";
import liste_CIS_MVP from "../medicament/[CIS]/liste_CIS_MVP.json";
import Link from "next/link";

async function getResults(query: string) {
  const specialites: Specialite[] = (
    await pdbmMySQL
      .selectFrom("Specialite")
      .where("SpecDenom01", "like", `%${query}%`)
      .selectAll()
      .execute()
  ).filter((specialite) => liste_CIS_MVP.includes(specialite.SpecId));

  return {
    specialites,
  };
}

function groupSpecialites(
  specialites: Specialite[],
): Map<string, Specialite[]> {
  const groups = new Map<string, Specialite[]>();
  for (const specialite of specialites) {
    const regexMatch = specialite.SpecDenom01.match(/^[^0-9]+/);
    const groupName = regexMatch ? regexMatch[0] : specialite.SpecDenom01;
    if (groups.has(groupName)) {
      groups.get(groupName)?.push(specialite);
    } else {
      groups.set(groupName, [specialite]);
    }
  }
  return groups;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const results = search && (await getResults(searchParams["s"]));

  return (
    <>
      <form action="/rechercher" className={fr.cx("fr-my-4w")}>
        <Input
          label={"Quel médicament cherchez-vous&nbsp;?"}
          hideLabel={true}
          addon={<Button iconId={"fr-icon-search-line"} title="Recherche" />}
          nativeInputProps={{
            name: "s",
            placeholder: "Rechercher",
            ...(search ? { defaultValue: search } : {}),
            type: "search",
          }}
        />
      </form>
      {results && (
        <>
          <p>{results.specialites.length} RÉSULTATS</p>
          <ul>
            {Array.from(groupSpecialites(results.specialites).entries()).map(
              ([groupName, specialites]: [string, Specialite[]]) => (
                <li key={groupName} className={"fr-mb-2w"}>
                  {formatSpecName(groupName)}
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
        </>
      )}
    </>
  );
}
