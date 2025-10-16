import { Fragment } from "react";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import MedicamentsListContent from "@/components/list/MedicamentsListContent";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Liste des médicaments";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const letters = ['1', '5', 'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

  return (
    <ContentContainer frContainer>
      <Fragment>
        <Breadcrumb
          segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
          currentPageLabel={PAGE_LABEL}
        />
        <MedicamentsListContent
          title={PAGE_LABEL}
          letter={letter}
          letters={letters}
        />
      </Fragment>
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
