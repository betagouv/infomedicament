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

  const atcCode = getAtcCode(CIS);
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

  const atcList = [];
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
          />
        )}
      </ContentContainer>
      <RatingToaster
        pageId={pageLabel}
      />
    </>
  );
}
