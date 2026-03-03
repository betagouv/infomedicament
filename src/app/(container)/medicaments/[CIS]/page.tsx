import React from "react";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { fr } from "@codegouvfr/react-dsfr";
import {
  displaySimpleComposants,
  formatSpecName,
} from "@/displayUtils";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { getAtc1, getAtc2 } from "@/db/utils/atc";
import { getSpecialite } from "@/db/utils";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSpecialiteGroupName, isCentralisee } from "@/utils/specialites";
import { getAtcCode } from "@/utils/atc";
import { getSpecialiteName } from "@/db/utils/specialities";
import MedicamentContainer from "@/components/medicaments/MedicamentContainer";
import { getPregnancyMentionAlert, getAllPregnancyPlanAlerts } from "@/db/utils/pregnancy";
import { getPediatrics } from "@/db/utils/pediatrics";
import { getMarr } from "@/db/utils/marr";
import { getNotice } from "@/db/utils/notice";
import { getFicheInfos } from "@/db/utils/ficheInfos";
import { getSpecialitePatho } from "@/db/utils/pathologies";
import { getArticlesFromFilters } from "@/db/utils/articles";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ CIS: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { CIS } = await props.params;

  const SpecDenom01 = await getSpecialiteName(CIS);
  if (!SpecDenom01) return notFound();

  const name = formatSpecName(SpecDenom01);
  return {
    title: `${name} - ${(await parent).title?.absolute}`,
  };
}

export default async function Page(props: {
  params: Promise<{ CIS: string }>;
}) {

  const { CIS } = await props.params;

  // Round 1: all fetches that only need the CIS code, run in parallel
  const [
    { specialite, composants, presentations, delivrance },
    atcCode,
    isPregnancyMentionAlert,
    allPregnancyPlanAlerts,
    pediatrics,
    marr,
    hasReferencingGenerics,
    isInGroupeGene,
  ] = await Promise.all([
    getSpecialite(CIS),
    getAtcCode(CIS),
    getPregnancyMentionAlert(CIS),
    getAllPregnancyPlanAlerts(),
    getPediatrics(CIS),
    getMarr(CIS),
    pdbmMySQL
      .selectFrom("Specialite")
      .select("Specialite.SpecId")
      .where("Specialite.SpecGeneId", "=", CIS)
      .executeTakeFirst(),
    pdbmMySQL
      .selectFrom("GroupeGene")
      .select("GroupeGene.SpecId")
      .where("GroupeGene.SpecId", "=", CIS)
      .executeTakeFirst(),
  ]);

  const isPrinceps = !!(hasReferencingGenerics && isInGroupeGene);
  const pregnancyPlanAlert = allPregnancyPlanAlerts.find((s) =>
    composants.find((c) => Number(c.SubsId.trim()) === Number(s.id))
  );

  // Round 2: fetches that need specialite, run in parallel
  const [atc1, atc2, notice, ficheInfos, patho] = await Promise.all([
    atcCode ? getAtc1(atcCode) : Promise.resolve(undefined),
    atcCode ? getAtc2(atcCode) : Promise.resolve(undefined),
    (specialite && !isCentralisee(specialite)) ? getNotice(CIS) : Promise.resolve(undefined),
    specialite ? getFicheInfos(CIS) : Promise.resolve(undefined),
    specialite ? getSpecialitePatho(CIS) : Promise.resolve(undefined),
  ]);

  // Round 3: articles depend on atcList and patho from Round 2
  const atcList: string[] = [];
  if (atc1) atcList.push(atc1.code.trim());
  if (atc2) atcList.push(atc2.code.trim());

  const articles = specialite ? await getArticlesFromFilters({
    ATCList: atcList,
    substancesList: composants.map((c) => c.SubsId.trim()),
    specialitesList: [specialite.SpecId],
    pathologiesList: patho ?? [],
  }) : [];

  const breadcrumb = [
    { label: "Accueil", linkProps: { href: "/" } },
  ];
  if (atc1) {
    atcList.push(atc1.code.trim());
    breadcrumb.push({ label: atc1.label, linkProps: { href: `/atc/${atc1.code}` } });
  }
  if (atc2) {
    atcList.push(atc2.code.trim());
    breadcrumb.push({ label: atc2.label, linkProps: { href: `/atc/${atc2.code}` } });
  }

  if (composants.length > 0) {
    breadcrumb.push({
      label: displaySimpleComposants(composants)
        .map((s) => s.NomLib.trim())
        .join(", "),
      linkProps: {
        href: `/substances/${displaySimpleComposants(composants)
          .map((s) => s.NomId.trim())
          .join(",")}`,
      },
    });
  }
  if (specialite) {
    breadcrumb.push({
      label: formatSpecName(getSpecialiteGroupName(specialite)),
      linkProps: {
        href: `/rechercher?s=${formatSpecName(getSpecialiteGroupName(specialite))}`,
      },
    });
  }

  const pageLabel = specialite ? formatSpecName(specialite.SpecDenom01) : await getSpecialiteName(CIS);

  return (
    <>
      <ContentContainer frContainer>
        <Breadcrumb
          segments={breadcrumb}
          currentPageLabel={
            specialite ? formatSpecName(specialite.SpecDenom01).replace(
              formatSpecName(getSpecialiteGroupName(specialite)),
              "",
            ) : ""}
          className={fr.cx("fr-mb-2w")}
        />
        <h1 className={fr.cx("fr-h2")}>
          {pageLabel}
        </h1>
      </ContentContainer>
      <ContentContainer className={fr.cx("fr-pt-1w", "fr-pb-2w")} style={{
        backgroundColor:
          fr.colors.decisions.background.alt.grey.default,
      }}>
        {!specialite ? (
          <ContentContainer frContainer>
            Le médicament demandé n'existe pas ou il n'entre pas dans le périmètre d'Info Médicament.
          </ContentContainer>
        ) : (
          <MedicamentContainer
            atcList={atcList}
            atc2={atc2}
            atcCode={atcCode}
            specialite={specialite}
            composants={composants}
            delivrance={delivrance}
            presentations={presentations}
            isPrinceps={isPrinceps}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pregnancyPlanAlert={pregnancyPlanAlert}
            pediatrics={pediatrics}
            marr={marr}
            notice={notice}
            ficheInfos={ficheInfos}
            articles={articles}
          />
        )}
      </ContentContainer>
      <RatingToaster
        pageId={pageLabel}
      />
    </>
  );
}
