import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import PageListContent from "@/components/list/PageListContent";
import { getLetters } from "@/db/utils/letters";
import { getIndicationsResumeWithLetter } from "@/db/utils/indications";
import { DataTypeEnum } from "@/types/DataTypes";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL: string = "Liste des indications";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const [letters, rawData] = await Promise.all([
    getLetters("indications"),
    getIndicationsResumeWithLetter(letter),
  ]);
  const dataList = rawData.sort((a, b) => a.nomIndication.localeCompare(b.nomIndication));

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <PageListContent
        title={PAGE_LABEL}
        description="L'indication thérapeutique renseigne sur la maladie ou les symptômes que le médicament est capable de traiter ou de prévenir, ou encore sur le diagnostic qu'il permet d'établir. L'indication est précisée dans l'AMM."
        letters={letters}
        urlPrefix="/indications/"
        dataList={dataList}
        type={DataTypeEnum.INDICATION}
        currentLetter={letter}
      />
      <RatingToaster pageId={`${PAGE_LABEL} ${letter}`} />
    </ContentContainer>
  );
}
