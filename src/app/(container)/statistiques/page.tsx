
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import Statistics from "@/components/statistics/Statistics";
import ShareButtons from "@/components/generic/ShareButtons";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page() {
  return (
    <ContentContainer frContainer>
      {" "}
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Statistiques"
      />
      <h1 className={fr.cx("fr-h2")}>
        Nos statistiques
      </h1>
      <ContentContainer frContainer>
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            <ShareButtons 
              pageName="Nos statistiques"
              rightAlign={true} 
              className={fr.cx("fr-mb-3w")}
            />
          </div>
        </div>
      </ContentContainer>
      <ContentContainer frContainer>
        <Statistics />
      </ContentContainer>
    </ContentContainer>
  );
}
