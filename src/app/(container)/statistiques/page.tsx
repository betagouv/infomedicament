
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import Statistics from "@/components/statistics/Statistics";
import ShareButtons from "@/components/generic/ShareButtons";
import RatingToaster from "@/components/rating/RatingToaster";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Nos statistiques";

export default async function Page() {
  return (
    <ContentContainer frContainer>
      {" "}
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Statistiques"
      />
      <h1 className={fr.cx("fr-h2")}>
        {PAGE_LABEL}
      </h1>
      <ShareButtons 
        pageName={PAGE_LABEL}
        className={fr.cx("fr-mb-3w")}
      />
      <ContentContainer frContainer>
        <Statistics />
      </ContentContainer>
      <RatingToaster
        pageId={PAGE_LABEL}
      />
    </ContentContainer>
  );
}
