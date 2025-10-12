import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import { getSpecialiteGroupName } from "@/db/utils";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/generic/PageListContent";
import RatingToaster from "@/components/rating/RatingToaster";
import { getAllSubsWithSpecialites } from "@/db/utils/substances";
import { SubstanceResume } from "@/types/SubstanceTypes";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Liste des substances";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

    const allSubs = await getAllSubsWithSpecialites();
    const letters: string[] = [];
    const filteredSubs: SubstanceResume[] = [];
  
    allSubs.forEach((sub) => {
      const subLetter = sub.NomLib.substring(0,1).toUpperCase();
      if(!letters.includes(subLetter)) letters.push(subLetter);
      if(subLetter !== letter) return;
  
      const index = filteredSubs.findIndex((filteredSub) => filteredSub.SubsId === sub.SubsId);
      if(index !== -1) {
        const specGroupName = getSpecialiteGroupName(sub.SpecDenom01);
        if(!filteredSubs[index].medicaments.includes(specGroupName)){
          filteredSubs[index].medicaments.push(specGroupName);
        }
      } else filteredSubs.push({
        SubsId: sub.SubsId,
        NomId: sub.NomId,
        NomLib: sub.NomLib,
        medicaments: [
          getSpecialiteGroupName(sub.SpecDenom01),
        ],
      });
    })
  
    if (!filteredSubs || !filteredSubs.length) return notFound();

  return (
    <ContentContainer frContainer>
      {" "}
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <PageListContent
        title={PAGE_LABEL}
        letters={letters}
        urlPrefix="/substances/"
        dataList={filteredSubs}
        type={DataTypeEnum.SUBSTANCE}
        currentLetter={letter}
      />
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
