import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import { DataTypeEnum } from "@/types/DataTypes";
import { getAllPathoWithSpecialites } from "@/db/utils/pathologies";
import { getSpecialiteGroupName } from "@/db/utils";
import PageListContent from "@/components/generic/PageListContent";
import RatingToaster from "@/components/rating/RatingToaster";
import { PathologyResume } from "@/types/PathologyTypes";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Liste des pathologies";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const allPathos = await getAllPathoWithSpecialites();
  const letters: string[] = [];
  const filteredPathos: PathologyResume[] = [];

  allPathos.forEach((patho) => {
    const pathoLetter = patho.NomPatho.substring(0,1).toUpperCase();
    if(!letters.includes(pathoLetter)) letters.push(pathoLetter);
    if(pathoLetter !== letter) return;

    const index = filteredPathos.findIndex((filteredPatho) => filteredPatho.codePatho === patho.codePatho);
    if(index !== -1) {
      const specGroupName = getSpecialiteGroupName(patho.SpecDenom01);
      if(!filteredPathos[index].medicaments.includes(specGroupName)){
        filteredPathos[index].medicaments.push(specGroupName);
      }
    } else filteredPathos.push({
      codePatho: patho.codePatho,
      NomPatho: patho.NomPatho,
      medicaments: [
        getSpecialiteGroupName(patho.SpecDenom01),
      ],
    });
  })

  if (!filteredPathos || !filteredPathos.length) return notFound();
  
  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <PageListContent
        title={PAGE_LABEL}
        letters={letters}
        urlPrefix="/pathologies/"
        dataList={filteredPathos}
        type={DataTypeEnum.PATHOLOGY}
        currentLetter={letter}
      />
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
