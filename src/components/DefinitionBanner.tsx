import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";
import ShareButtons from "./generic/ShareButtons";

export default async function DefinitionBanner({
  type,
  title,
  definition,
}: {
  type: string;
  title: string;
  definition: string | { title: string; desc: string }[];
}) {
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-md-8")}>
        <Badge className={fr.cx("fr-badge--purple-glycine")}>{type}</Badge>
        <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-0")}>{title}</h1>
        <ShareButtons leftAlign={true} className={fr.cx("fr-mb-6w")} />
        {typeof definition === "string" ? (
          <div className={fr.cx("fr-grid-row")}>
            <div className={fr.cx("fr-col")}>
              <Card title="Définition" titleAs={"h6"} desc={definition} />
            </div>
          </div>
        ) : (
          definition.map(({ title, desc }) => (
            <div key={title} className={fr.cx("fr-grid-row", "fr-mb-1w")}>
              <div className={fr.cx("fr-col")}>
                <Card title={title} titleAs={"h6"} desc={desc} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
