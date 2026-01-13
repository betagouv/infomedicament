import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import GenericsListContent from "@/components/list/GenericsListContent";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Liste des groupes génériques";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <GenericsListContent
        title={PAGE_LABEL}
        letter={letter}
      />
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
