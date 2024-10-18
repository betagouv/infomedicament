import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";

export default async function DefinitionBanner({
  type,
  title,
  definition,
}: {
  type: string;
  title: string;
  definition: string;
}) {
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-md-8")}>
        <Badge className={fr.cx("fr-badge--purple-glycine")}>{type}</Badge>
        <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-6w")}>{title}</h1>
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col")}>
            <Card title="Définition" titleAs={"h6"} desc={definition} />
          </div>
        </div>
      </div>
    </div>
  );
}
