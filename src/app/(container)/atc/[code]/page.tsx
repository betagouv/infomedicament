import { fr } from "@codegouvfr/react-dsfr";
import { getAtc, getAtc1, getAtc2, getAtc1DefinitionData, getSubstancesByAtc } from "@/db/utils/atc";
import { ATC, ATC1, ATCSubsSpecs } from "@/types/ATCTypes";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { notFound } from "next/navigation";
import React from "react";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import ATC1DefinitionContent from "@/components/definition/ATC1DefinitionContent";
import ATC2DefinitionContent from "@/components/definition/ATC2DefinitionContent";
import { ATCError } from "@/utils/atc";
import { getArticlesFromATC } from "@/db/utils/articles";
import { groupSpecialites } from "@/utils/specialites";
import { AdvancedATCClass } from "@/types/DataTypes";
import { SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import { getSubstancesResume } from "@/db/utils/substances";
import { ResumeSubstance } from "@/db/types";
import { ArticleCardResume } from "@/types/ArticlesTypes";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateStaticParams() {
  const atcTree = await getAtc();
  return atcTree.flatMap((atc1) => [
    { code: atc1.code },
    ...(atc1.children as ATC[]).map((atc2) => ({ code: atc2.code })),
  ]);
}

async function fetchATC1Data(atc1: ATC1): Promise<{ articles: ArticleCardResume[]; dataList: AdvancedATCClass[] }> {
  const [articles, allATC] = await Promise.all([
    getArticlesFromATC(atc1.code),
    getAtc1DefinitionData(atc1),
  ]);
  const dataList = (allATC as ATCSubsSpecs[]).map((atcSubsSpecs) => {
    let nbSubs = 0;
    atcSubsSpecs.substances.forEach((sub) => {
      const subSpecs = atcSubsSpecs.specialites
        .filter((spec: SpecialiteWithSubstance) => spec.NomId.trim() === sub.NomId.trim());
      if (groupSpecialites(subSpecs).length > 0) nbSubs++;
    });
    return {
      class: { nbSubstances: nbSubs, ...atcSubsSpecs.atc, children: atcSubsSpecs.atc.children ?? [] },
      subclasses: [],
    };
  }).filter((data) => data.class.nbSubstances > 0);
  return { articles, dataList };
}

async function fetchATC2Data(atc2: ATC): Promise<{ articles: ArticleCardResume[]; dataList: ResumeSubstance[] }> {
  const [articles, substances] = await Promise.all([
    getArticlesFromATC(atc2.code),
    getSubstancesByAtc(atc2),
  ]);
  const subsNomIDs = [...new Set(substances.map((s) => s.NomId.trim()))];
  const dataList = await getSubstancesResume(subsNomIDs);
  return { articles, dataList };
}

export default async function Page(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;

  let atc1, atc2;
  try {
    atc1 = code ? await getAtc1(code) : undefined;
    atc2 = code && code.length === 3 ? await getAtc2(code) : undefined;
  } catch (e) {
    if (e instanceof ATCError) notFound();
    throw e;
  }
  const currentAtc = atc2 || atc1 || undefined;
  if (!currentAtc || !atc1) notFound();

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <Breadcrumb
            segments={[
              { label: "Accueil", linkProps: { href: "/" } },
              ...(atc2 ? [{ label: atc1.label, linkProps: { href: `/atc/${atc1.code}` } }] : []),
            ]}
            currentPageLabel={currentAtc.label}
          />
        </div>
      </div>
      {atc2 ? (
        <ATC2DefinitionContent atc={atc2} {...await fetchATC2Data(atc2)} />
      ) : (
        <ATC1DefinitionContent atc={atc1} {...await fetchATC1Data(atc1)} />
      )}
      <RatingToaster pageId={currentAtc.label} />
    </ContentContainer>
  );
}
