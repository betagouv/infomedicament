import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/AutocompleteSearch";

export default async function Page() {
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
        <form action="/rechercher">
          <h1 className={fr.cx("fr-h5")}>
            Quel médicament cherchez-vous&nbsp;?
          </h1>
          <AutocompleteSearch />
        </form>
      </div>
    </div>
  );
}
