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
import { getSpecialiteGroupName } from "@/utils/specialites";
import { getAtcCode } from "@/utils/atc";
import { getSpecialiteName } from "@/db/utils/specialities";
import MedicamentContainer from "@/components/medicaments/MedicamentContainer";
import { getNotice } from "@/db/utils/notice";
import { getPregnancyMentionAlert, getAllPregnancyPlanAlerts } from "@/db/utils/pregnancy";
import { getPediatrics } from "@/db/utils/pediatrics";
import { getMarr } from "@/db/utils/marr";
import { getSpecialitePathologies } from "@/db/utils/indications";
import { getArticlesFromFilters } from "@/db/utils/articles";
import { getFicheInfos } from "@/db/utils/ficheInfos";
import { getHighlightedGlossaryDefinitions } from "@/db/utils/glossary";

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
  const { specialite, composants, presentations, delivrance } =
    await getSpecialite(CIS);

  const atcCode = await getAtcCode(CIS);
  const atc1 = atcCode ? await getAtc1(atcCode) : undefined;
  const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

  const isPrinceps =
    !!(await pdbmMySQL
      .selectFrom("Specialite")
      .select("Specialite.SpecId")
      .where("Specialite.SpecGeneId", "=", CIS)
      .executeTakeFirst()) &&
    !!(await pdbmMySQL
      .selectFrom("GroupeGene")
      .select("GroupeGene.SpecId")
      .where("GroupeGene.SpecId", "=", CIS)
      .executeTakeFirst());

  const atcList: string[] = [];
  if (atc1) atcList.push(atc1.code.trim());
  if (atc2) atcList.push(atc2.code.trim());

  const [
    notice,
    pregnancyMentionAlert,
    pediatrics,
    marr,
    allPregnancyPlanAlerts,
    specialitePathologies,
    ficheInfos,
    definitions,
  ] = await Promise.all([
    getNotice(CIS),
    getPregnancyMentionAlert(CIS),
    getPediatrics(CIS),
    getMarr(CIS),
    getAllPregnancyPlanAlerts(),
    getSpecialitePathologies(CIS),
    getFicheInfos(CIS),
    getHighlightedGlossaryDefinitions(),
  ]);

  const pregnancyPlanAlert = allPregnancyPlanAlerts.find((s) =>
    composants.some((c) => Number(c.SubsId.trim()) === Number(s.id))
  );

  const articles = await getArticlesFromFilters({
    ATCList: atcList,
    substancesList: composants.map((c) => c.SubsId.trim()),
    specialitesList: [CIS],
    pathologiesList: specialitePathologies,
  });

  const breadcrumb = [
    { label: "Accueil", linkProps: { href: "/" } },
  ];
  if (atc1) {
    breadcrumb.push({ label: atc1.label, linkProps: { href: `/atc/${atc1.code}` } });
  }
  if (atc2) {
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
            initialNotice={notice}
            pregnancyPlanAlert={pregnancyPlanAlert}
            isPregnancyMentionAlert={pregnancyMentionAlert}
            pediatrics={pediatrics}
            marr={marr}
            articles={articles}
            ficheInfos={ficheInfos}
            definitions={definitions}
          />
        )}
      </ContentContainer>
      <RatingToaster
        pageId={pageLabel}
      />
    </>
  );
}
