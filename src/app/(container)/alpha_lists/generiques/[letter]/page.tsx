import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import PageListContent from "@/components/list/PageListContent";
import { getLetters } from "@/db/utils/letters";
import { getGenericsResumeWithLetter } from "@/db/utils/generics";
import { DataTypeEnum } from "@/types/DataTypes";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL: string = "Liste des groupes génériques";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const [letters, rawData] = await Promise.all([
    getLetters("generiques"),
    getGenericsResumeWithLetter(letter),
  ]);
  const dataList = rawData.sort((a, b) => a.SpecName.localeCompare(b.SpecName));

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <PageListContent
        title={PAGE_LABEL}
        letters={letters}
        urlPrefix="/generiques/"
        dataList={dataList}
        type={DataTypeEnum.MEDICAMENT}
        currentLetter={letter}
        isGeneric
      />
      <RatingToaster pageId={`${PAGE_LABEL} ${letter}`} />
    </ContentContainer>
  );
}
