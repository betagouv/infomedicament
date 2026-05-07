import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import PageListContent from "@/components/list/PageListContent";
import { getLetters } from "@/db/utils/letters";
import { getSubstancesResumeWithLetter } from "@/db/utils/substances";
import { DataTypeEnum } from "@/types/DataTypes";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL: string = "Liste des substances";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const [letters, rawData] = await Promise.all([
    getLetters("substances"),
    getSubstancesResumeWithLetter(letter),
  ]);
  const dataList = rawData.sort((a, b) => a.NomLib.localeCompare(b.NomLib));

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <PageListContent
        title={PAGE_LABEL}
        letters={letters}
        urlPrefix="/substances/"
        dataList={dataList}
        type={DataTypeEnum.SUBSTANCE}
        currentLetter={letter}
      />
      <RatingToaster pageId={`${PAGE_LABEL} ${letter}`} />
    </ContentContainer>
  );
}
