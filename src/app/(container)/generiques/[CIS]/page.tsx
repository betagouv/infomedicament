import Badge from "@codegouvfr/react-dsfr/Badge";
import {
  getSpecialite,
  groupGeneNameToDCI,
} from "@/db/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import React from "react";

import { formatSpecName } from "@/displayUtils";
import { getAtc2 } from "@/db/utils/atc";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSpecialiteGroupName } from "@/utils/specialites";
import { getAtcCode } from "@/utils/atc";
import MedicamentGeneriqueContainer from "@/components/medicamentsGeneriques/MedicamentGeneriqueContainer";
import { getGenericGroup } from "@/db/utils/generics";
import { getEvents } from "@/db/utils/ficheInfos";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await props.params;

  const group = await getGenericGroup(CIS);
  if (!group) notFound();

  const displaySpecialite = group.princeps[0] ?? group.generiques[0];
  if (!displaySpecialite) notFound();
  const { composants } = await getSpecialite(displaySpecialite.SpecId);

  const CISList = [...group.princeps, ...group.generiques].map((specialite) => specialite.SpecId);
  const events = await getEvents(CISList);

  let atcCode = await getAtcCode(CIS);
  if (!atcCode) {
    for (const specialite of [...group.princeps, ...group.generiques]) {
      atcCode = await getAtcCode(specialite.SpecId);
      if (atcCode) break;
    }
  }
  const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

  const pageLabel = formatSpecName(groupGeneNameToDCI(group.libelle));
  const groupName = getSpecialiteGroupName(groupGeneNameToDCI(group.libelle));

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
        princeps={group.princeps}
        generiques={group.generiques}
        events={events}
      />
      <RatingToaster
        pageId={pageLabel}
      />
    </>
  );
}
