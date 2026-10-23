import { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { Metadata } from "next";
import { getSubstanceDefinition, getSubstancesNames } from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";
import { getArticlesFromSubstances } from "@/db/utils/articles";
import { getSubstanceSpecsGroups } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { getSubstanceIdsFromSlug, getSubstanceMainName, getSubstanceSlug, getSubstancesNamesList } from "@/utils/substances";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { Substance, SubstancesName } from "@/types/SubstanceTypes";
import { notFound } from "next/navigation";
import { formatFrenchList } from "@/displayUtils";


// Check if all the requested substances are loaded
// Usefull when the page are for multiple substances and some of them are the same
const hasAllSubstances = (subsIds: string[], substances: Substance[]): boolean =>
  subsIds.every((subsId) => substances.some((subs) => subs.SubsId.trim() === subsId));

// Title and subtitle of the page: only the substances names from specsGroups
const getSubstancesPageNames = (
  subsIds: string[],
  substances: Substance[],
  specsGroups: ResumeSpecGroup[],
): { title: string, subtitle: string, titleDetails: SubstancesName["details"] } => {
  // Title: the canonical names if displayed on the medicaments, otherwise the names displayed on the most medicaments
  // Title and subtitle: the substances in the order of the page ids
  const namesList = getSubstancesNamesList(substances, specsGroups, subsIds);
  const titleNames = namesList.find((names) => names.isCanonical) ?? namesList[0];
  if (titleNames) {
    // Subtitle: the other names
    const secondaryNames = namesList
      .filter((names) => names !== titleNames)
      .map((names) => names.name);
    return {
      title: titleNames.name,
      subtitle: secondaryNames.join(subsIds.length > 1 ? " ; " : ", "),
      titleDetails: titleNames.details,
    };
  }
  // No medicament: main name of each substance
  return {
    title: subsIds.map((subsId) => getSubstanceMainName(substances.filter((subs) => subs.SubsId.trim() === subsId))).join(", "),
    subtitle: "",
    titleDetails: [],
  };
};

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {

  const subsIds = getSubstanceIdsFromSlug((await props.params).slug);
  const substances: Substance[] = await getSubstancesNames(subsIds) ?? [];
  if (!hasAllSubstances(subsIds, substances)) {
    return {
      title: `Substance ${formatFrenchList(subsIds)}`,
    };
  }

  const [definitionsRaw, allSpecsGroups] = await Promise.all([
    getSubstanceDefinition(subsIds),
    getSubstanceSpecsGroups(subsIds),
  ]);
  const definitionString = definitionsRaw.map(d => `${d.SA} : ${d.Definition}`).join(" - ");
  const { title } = getSubstancesPageNames(subsIds, substances, allSpecsGroups);

  return {
    title: formatFrenchList(substances.map((s) => s.NomLib)),
    // Fallback when no definition is available for these substances
    description: definitionString
      || `Retrouvez les médicaments contenant ${substances.length > 1 ? "les substances" : "la substance"} ${formatFrenchList(substances.map((s) => s.NomLib))}.`,
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

  const subsIds = getSubstanceIdsFromSlug(slug);
  const substances: Substance[] = await getSubstancesNames(subsIds) ?? [];
  if (!hasAllSubstances(subsIds, substances)) notFound();

  const [articles, definitions, allSpecsGroups] = await Promise.all([
    getArticlesFromSubstances(subsIds),
    getSubstanceDefinition(subsIds),
    getSubstanceSpecsGroups(subsIds),
  ]);

  const dataList = allSpecsGroups.length > 0
    ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
    : [];

  const { title, subtitle, titleDetails } = getSubstancesPageNames(subsIds, substances, allSpecsGroups);
  // Definition title: no title with a single substance, otherwise the name of its substance in the page title
  const definition = definitions
    // Only the definitions with a text
    .filter((d) => d.Definition.trim().length > 0)
    .map((d) => ({
      title: subsIds.length > 1
        ? titleDetails.find((detail) => detail.subsId === d.SubsId.trim())?.name ?? d.SA
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
                  href: `/substances/${title[0].slice(0, 1)}`,
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
      <RatingToaster
        pageId={title}
      />
    </ContentContainer>
  );
}
