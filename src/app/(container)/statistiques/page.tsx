
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import Statistics from "@/components/statistics/Statistics";

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
        <Statistics />
      </ContentContainer>
    </ContentContainer>
  );
}
