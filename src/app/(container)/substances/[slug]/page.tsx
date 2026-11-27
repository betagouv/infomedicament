import { StartDsfrOnHydration } from "@/dsfr-bootstrap";
import { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { Metadata } from "next";
import {
  getSubstanceDefinition,
  getSubstancesNames,
  getSubstancesTitles,
} from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";
import { getArticlesFromSubstances } from "@/db/utils/articles";
import { getSubstanceSpecsGroups } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import {
  getSubstanceIdsFromSlug,
  getSubstanceSlug,
  getSubstancesPageNames,
  hasAllSubstances,
} from "@/utils/substances";
import { Substance } from "@/types/SubstanceTypes";
import { notFound } from "next/navigation";
import { formatFrenchList } from "@/displayUtils";
import { getNormalizeLetter } from "@/utils/alphabeticNav";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const subsIds = getSubstanceIdsFromSlug((await props.params).slug);
  const substances: Substance[] = (await getSubstancesNames(subsIds)) ?? [];
  if (!hasAllSubstances(subsIds, substances)) {
    return {
      title: `Substance ${formatFrenchList(subsIds)}`,
    };
  }

  const [definitionsRaw, allSpecsGroups, titles] = await Promise.all([
    getSubstanceDefinition(subsIds),
    getSubstanceSpecsGroups(subsIds),
    getSubstancesTitles(subsIds),
  ]);
  const definitionString = definitionsRaw
    .map((d) => `${d.SA} : ${d.Definition}`)
    .join(" - ");
  // Title: the stored titles (resume_substances.title), computed if not seeded
  const { title } = getSubstancesPageNames(
    subsIds,
    substances,
    allSpecsGroups,
    titles,
  );

  return {
    title,
    // Fallback when no definition is available for these substances
    description:
      definitionString ||
      `Retrouvez les médicaments contenant ${subsIds.length > 1 ? "les substances" : "la substance"} ${title}.`,
    alternates: {
      // Titles of the substances pages (resume_substances), followed by the SubsIds
      canonical: `/substances/${getSubstanceSlug(subsIds.map((SubsId) => ({ SubsId, title: titles.get(SubsId) })))}`,
    },
  };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <StartDsfrOnHydration />
      <Suspense fallback={<PageLoadingFallback />}>
        <ResolvedSubstancePage params={props.params} />
      </Suspense>
    </>
  );
}

async function ResolvedSubstancePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CachedSubstancePage slug={slug} />;
}

async function CachedSubstancePage({ slug }: { slug: string }) {
  "use cache: remote";

  const subsIds = getSubstanceIdsFromSlug(slug);
  const substances: Substance[] = (await getSubstancesNames(subsIds)) ?? [];
  if (!hasAllSubstances(subsIds, substances)) notFound();

  const [articles, definitions, allSpecsGroups, titles] = await Promise.all([
    getArticlesFromSubstances(subsIds),
    getSubstanceDefinition(subsIds),
    getSubstanceSpecsGroups(subsIds),
    getSubstancesTitles(subsIds),
  ]);

  const dataList =
    allSpecsGroups.length > 0
      ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
      : [];

  // Title: the stored titles (resume_substances.title), computed if not seeded
  const { title, subtitle, titleDetails } = getSubstancesPageNames(
    subsIds,
    substances,
    allSpecsGroups,
    titles,
  );
  // Definition title: no title with a single substance, otherwise the name of its substance in the page title
  const definition = definitions
    // Only the definitions with a text
    .filter((d) => d.Definition.trim().length > 0)
    .map((d) => ({
      title:
        subsIds.length > 1
          ? (titleDetails.find((detail) => detail.subsId === d.SubsId.trim())
              ?.name ?? d.SA)
          : "Définition",
      desc: d.Definition,
    }));

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
                  // Letter of the substances list: without accent and uppercase, as the letters of the lists (e.g. "é" -> "E")
                  href: `/substances/${getNormalizeLetter(title.slice(0, 1))}`,
                },
              },
            ]}
            currentPageLabel={title}
          />
        </div>
      </div>
      <SubstanceDefinitionContent
        subsIds={subsIds}
        articles={articles}
        definition={definition}
        dataList={dataList}
        title={title}
        subtitle={subtitle}
      />
      <RatingToaster pageId={title} />
    </ContentContainer>
  );
}
