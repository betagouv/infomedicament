import Badge from "@codegouvfr/react-dsfr/Badge";
import { getSpecialite } from "@/db/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import React from "react";

import { formatSpecName } from "@/displayUtils";
import { getAtc2 } from "@/db/utils/atc";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSpecialiteGroupName } from "@/utils/specialites";
import { ATCError, getAtcCode } from "@/utils/atc";
import MedicamentGeneriqueContainer from "@/components/medicamentsGeneriques/MedicamentGeneriqueContainer";
import { getGeneriques, getGroupeGene } from "@/db/utils/generics";
import { AnsmSpecialiteWithStatus } from "@/types/SpecialiteTypes";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await props.params;

  const group = await getGroupeGene(CIS);
  if (!group) notFound();

  const { specialite, composants } = await getSpecialite(group.SpecId);
  if (!specialite) notFound();

  const generiques: AnsmSpecialiteWithStatus[] = await getGeneriques(CIS);

  let atcCode;
  try {
    atcCode = await getAtcCode(CIS);
  } catch (e) {
    if (!(e instanceof ATCError)) throw e;
    for (const specialite of generiques) {
      try {
        atcCode = await getAtcCode(specialite.cis);
        break;
      } catch (e) {
        if (!(e instanceof ATCError)) throw e;
      }
    }
  }
  //if (!atcCode) throw new ATCError(CIS);
  const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

  const pageLabel = formatSpecName(group.LibLong);
  const groupName = getSpecialiteGroupName(group.LibLong);

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
        princeps={specialite}
        generiques={generiques}
      />
      <RatingToaster
        pageId={pageLabel}
      />
    </>
  );
}
