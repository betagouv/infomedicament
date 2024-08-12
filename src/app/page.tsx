import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import Button from "@codegouvfr/react-dsfr/Button";

export default async function Page() {
  return (
    <>
      <form action="/rechercher">
        <h1 className={fr.cx("fr-h5")}>Quel médicament cherchez-vous&nbsp;?</h1>
        <Input
          label={"Quel médicament cherchez-vous&nbsp;?"}
          hideLabel={true}
          addon={
            <Button
              iconId={"fr-icon-search-line"}
              title="Recherche"
              type="submit"
            />
          }
          nativeInputProps={{
            placeholder: "Rechercher",
            name: "s",
            type: "search",
          }}
        />
      </form>
    </>
  );
}
