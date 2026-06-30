import Badge from "@codegouvfr/react-dsfr/Badge";
import {
  groupGeneNameToDCI,
} from "@/db/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

import { formatSpecName } from "@/displayUtils";
import { getAtc2 } from "@/db/utils/atc";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSpecialiteGroupName } from "@/utils/specialites";
import { ATCError, getAtcCode } from "@/utils/atc";
import MedicamentGeneriqueContainer from "@/components/medicamentsGeneriques/MedicamentGeneriqueContainer";
import { getGeneriques, getGroupeGene } from "@/db/utils/generics";
import { SpecComposant, Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { getEvents } from "@/db/utils/ficheInfos";
import { getDetailedSpecialites } from "@/db/utils/specialities";
import { getComposants } from "@/db/utils/composants";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await props.params;

  const group = await getGroupeGene(CIS);
  if (!group || group.length === 0) notFound();

  const princepsCIS: string[] = group.map((princeps) => princeps.SpecId);
  const princeps = await getDetailedSpecialites(princepsCIS);
  if (!princeps || princeps.length === 0) notFound();

  const composants: Array<SpecComposant & SubstanceNom> = await getComposants(princepsCIS[0])
  const generiques: Specialite[] = await getGeneriques(CIS);

  const CISList = generiques.map((g) => g.SpecId).concat(princepsCIS);
  const events = await getEvents(CISList);

  let atcCode;
  try {
    atcCode = await getAtcCode(CIS);
  } catch (e) {
    if (!(e instanceof ATCError)) throw e;
    for (const specialite of generiques) {
      try {
        atcCode = await getAtcCode(specialite.SpecId);
        break;
      } catch (e) {
        if (!(e instanceof ATCError)) throw e;
      }
    }
  }
  const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

  //LibLong is the same for all elements of the group
  const pageLabel = formatSpecName(groupGeneNameToDCI(group[0].LibLong));
  const groupName = getSpecialiteGroupName(groupGeneNameToDCI(group[0].LibLong));

  return (
    <>
      <ContentContainer frContainer>
        <Breadcrumb
          segments={[
            { label: "Accueil", linkProps: { href: "/" } },
            {
              label: "Liste des groupes génériques",
              linkProps: { href: "/generiques/A" },
            },
          ]}
          currentPageLabel={pageLabel}
        />
        <Badge className="fr-badge--purple-glycine">Groupe générique</Badge>
        <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-6w")}>
          {pageLabel}
        </h1>
      </ContentContainer>
      <MedicamentGeneriqueContainer
        atc2={atc2}
        composants={composants}
        groupName={groupName}
        princeps={princeps}
        generiques={generiques}
        events={events}
      />
      <RatingToaster
        pageId={pageLabel}
      />
    </>
  );
}
