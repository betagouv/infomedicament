import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { pdbmMySQL, Specialite } from "@/db/pdbmMySQL";
import { fr } from "@codegouvfr/react-dsfr";

async function getResults(query: string) {
  const specialites: Specialite[] = await pdbmMySQL
    .selectFrom("Specialite")
    .where("SpecDenom01", "like", `%${query}%`)
    .selectAll()
    .execute();

  return {
    specialites,
  };
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
          }}
        />
      </form>
      {results && <span>{results.specialites.length} RÉSULTATS</span>}
    </>
  );
}
