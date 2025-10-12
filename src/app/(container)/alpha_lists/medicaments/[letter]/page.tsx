import { Fragment } from "react";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/generic/PageListContent";
import RatingToaster from "@/components/rating/RatingToaster";
import { Specialite } from "@/db/pdbmMySQL/types";
import { getSpecialites, groupSpecialites } from "@/db/utils/specialities";
import { notFound } from "next/navigation";
import { MedicamentGroup } from "@/displayUtils";
import { getAdvancedMedicamentFromGroup } from "@/db/utils/medicaments";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL:string = "Liste des médicaments";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const allSpecialites: Specialite[] = await getSpecialites();
  const letters: string[] = [];
  const filteredSpecialites: Specialite[] = [];

  allSpecialites.forEach((spec) => {
    const specLetter = spec.SpecDenom01.substring(0,1).toUpperCase();
    if(!letters.includes(specLetter)) letters.push(specLetter);
    if(specLetter !== letter) return;

    const index = filteredSpecialites.findIndex((filteredSpec) => filteredSpec.SpecId === spec.SpecId);
    if(index === -1) filteredSpecialites.push(spec);
  })

  if (!filteredSpecialites || !filteredSpecialites.length) return notFound();

  const medicaments: MedicamentGroup[] = groupSpecialites(filteredSpecialites);
  const detailedMedicaments = await getAdvancedMedicamentFromGroup(medicaments);

  return (
    <ContentContainer frContainer>
      <Fragment>
        <Breadcrumb
          segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
          currentPageLabel={PAGE_LABEL}
        />
        <PageListContent
          title={PAGE_LABEL}
          letters={letters}
          urlPrefix="/medicaments/"
          dataList={detailedMedicaments}
          type={DataTypeEnum.MEDGROUP}
          currentLetter={letter}
        />
      </Fragment>
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
