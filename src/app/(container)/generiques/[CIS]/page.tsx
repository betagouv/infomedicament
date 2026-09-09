import Badge from "@codegouvfr/react-dsfr/Badge";
import { getSpecialite, groupGeneNameToDCI } from "@/db/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import React, { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";

import { formatSpecName } from "@/displayUtils";
import { getAtc2 } from "@/db/utils/atc";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSpecialiteGroupName } from "@/utils/specialites";
import { ATCError, getAtcCode } from "@/utils/atc";
import MedicamentGeneriqueContainer from "@/components/medicamentsGeneriques/MedicamentGeneriqueContainer";
import { getGeneriques, getGroupeGene } from "@/db/utils/generics";
import { Specialite } from "@/db/pdbmMySQL/types";
import { getEvents } from "@/db/utils/ficheInfos";
import { cacheLife } from "next/cache";

export default function Page(props: { params: Promise<{ CIS: string }> }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ResolvedGenericPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedGenericPage({
  params,
}: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await params;
  return <CachedGenericPage CIS={CIS} />;
}

async function CachedGenericPage({ CIS }: { CIS: string }) {
  "use cache: remote";
  cacheLife("daily");

  const group = await getGroupeGene(CIS);
  if (!group) notFound();

  const { specialite, composants } = await getSpecialite(group.SpecId);
  if (!specialite) notFound();

  const generiques: Specialite[] = await getGeneriques(CIS);

  const CISList = generiques.map((g) => g.SpecId).concat(specialite.SpecId);
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
  //if (!atcCode) throw new ATCError(CIS);
  const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

  const pageLabel = formatSpecName(groupGeneNameToDCI(group.LibLong));
  const groupName = getSpecialiteGroupName(groupGeneNameToDCI(group.LibLong));

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
        <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-6w")}>{pageLabel}</h1>
      </ContentContainer>
      <MedicamentGeneriqueContainer
        atc2={atc2}
        composants={composants}
        groupName={groupName}
        princeps={specialite}
        generiques={generiques}
        events={events}
      />
      <RatingToaster pageId={pageLabel} />
    </>
  );
}
