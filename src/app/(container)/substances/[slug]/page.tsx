import { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";
import { fr } from "@codegouvfr/react-dsfr";
import type { Substance } from "@/types/SubstanceTypes";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { Metadata } from "next";
import { getSubstances, getSubstanceDefinition } from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";
import { getArticlesFromSubstances } from "@/db/utils/articles";
import { getResumeSpecsGroupsWithCIS, getSubstanceSpecialitesCIS } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { getSubstanceIdsFromSlug, getSubstanceSlug } from "@/utils/substances";


export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {

  const ids = getSubstanceIdsFromSlug((await props.params).slug);//NomId
  const substances: Substance[] = await getSubstances(ids);
  if (substances.length === 0 || substances.length < ids.length) {
    return {
      title: `Substance ${ids.join(", ")}`,
    };
  }

  const definitionsRaw = await getSubstanceDefinition(ids, substances.map((subs) => subs.SubsId.trim()));
  const definitionString = definitionsRaw.map(d => `${d.SA} : ${d.Definition}`).join(" - ")

  return {
    title: `${substances.map((s) => s.NomLib).join(", ")}`,
    description: definitionString,
    alternates: {
      canonical: `/substances/${getSubstanceSlug(substances)}`,
    },
  };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <Suspense fallback={<PageLoadingFallback />}><ResolvedSubstancePage params={props.params} /></Suspense>;
}

async function ResolvedSubstancePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CachedSubstancePage slug={slug} />;
}

async function CachedSubstancePage({ slug }: { slug: string }) {
  "use cache: remote";
  const ids = getSubstanceIdsFromSlug(slug);//NomId

  const substances: Substance[] = await getSubstances(ids);
  if (substances.length === 0 || substances.length < ids.length) return notFound();

  const subsIds = substances.map((s) => s.SubsId.trim());

  const [articles, definitions, CISList] = await Promise.all([
    getArticlesFromSubstances(ids),
    getSubstanceDefinition(ids, subsIds),
    getSubstanceSpecialitesCIS(ids),
  ]);

  const definition = definitions.map((d) => ({ title: d.SA, desc: d.Definition }));

  const allSpecsGroups = await getResumeSpecsGroupsWithCIS(CISList);
  const dataList = allSpecsGroups.length > 0
    ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
    : [];

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <Breadcrumb
            segments={[
              { label: "Accueil", linkProps: { href: "/" } },
              {
                label: "Listes des substances",
                linkProps: {
                  href: `/substances/${substances[0].NomLib.slice(0, 1)}`,
                },
              },
            ]}
            currentPageLabel={substances.map((s) => s.NomLib).join(", ")}
          />
        </div>
      </div>
      <SubstanceDefinitionContent
        ids={ids}
        substances={substances}
        articles={articles}
        definition={definition}
        dataList={dataList}
      />
      <RatingToaster
        pageId={substances.map((s) => s.NomLib).join(", ")}
      />
    </ContentContainer>
  );
}
