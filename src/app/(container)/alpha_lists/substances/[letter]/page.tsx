import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import SubstancesListContent from "@/components/list/SubstancesListContent";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Liste des substances";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  return (
    <ContentContainer frContainer>
      {" "}
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <SubstancesListContent
        title={PAGE_LABEL}
        letter={letter}
      />
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
