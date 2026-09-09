
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import Statistics from "@/components/statistics/Statistics";
import ShareButtons from "@/components/generic/ShareButtons";
import RatingToaster from "@/components/rating/RatingToaster";
import { cacheLife } from "next/cache";

const PAGE_LABEL:string = "Nos statistiques";

export default async function Page() {
  "use cache: remote";
  cacheLife("hourly");

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
