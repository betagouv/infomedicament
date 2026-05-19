import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import PageListContent from "@/components/list/PageListContent";
import { getLetters } from "@/db/utils/letters";
import { getResumeSpecsGroupsWithLetter } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { DataTypeEnum } from "@/types/DataTypes";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateStaticParams() {
  const letters = await getLetters("specialites");
  return letters.map((letter) => ({ letter }));
}
const PAGE_LABEL: string = "Liste des médicaments";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const [letters, specsGroups] = await Promise.all([
    getLetters("specialites"),
    getResumeSpecsGroupsWithLetter(letter),
  ]);
  const dataList = (await getResumeSpecsGroupsATCLabels(specsGroups)).sort((a, b) =>
    a.groupName.localeCompare(b.groupName)
  );

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <PageListContent
        title={PAGE_LABEL}
        letters={letters}
        urlPrefix="/medicaments/"
        dataList={dataList}
        type={DataTypeEnum.MEDICAMENT}
        currentLetter={letter}
      />
      <RatingToaster pageId={`${PAGE_LABEL} ${letter}`} />
    </ContentContainer>
  );
}
