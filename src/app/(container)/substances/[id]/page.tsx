import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { Metadata, ResolvingMetadata } from "next";
import { getSubstanceDefinition, getSubstancesNames } from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";
import { getArticlesFromSubstances } from "@/db/utils/articles";
import { getSubstanceSpecsGroups } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { getSubstanceMainName, getSubstancePageNames } from "@/utils/substances";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { Substance } from "@/types/SubstanceTypes";
import { notFound } from "next/navigation";

export const dynamic = "error";
export const dynamicParams = true;

// Check if all the requested substances are loaded
// Usefull when the page are for multiple substances and some of them are the same
const hasAllSubstances = (subsIds: string[], substances: Substance[]): boolean =>
  subsIds.every((subsId) => substances.some((subs) => subs.SubsId.trim() === subsId));

// Title and subtitle of the page: only the substances names in specsGroups
const getSubstancesPageNames = (
  subsIds: string[],
  substances: Substance[],
  specsGroups: ResumeSpecGroup[],
): { title: string, subtitle: string } => {
  const names = getSubstancePageNames(subsIds, specsGroups);
  if (names.title) {
    return { title: names.title, subtitle: names.secondaryNames.join(subsIds.length > 1 ? " ; " : ", ") };
  }
  // No medicament: main name of each substance
  return {
    title: subsIds.map((subsId) => getSubstanceMainName(substances.filter((subs) => subs.SubsId.trim() === subsId))).join(", "),
    subtitle: "",
  };
};

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {

  const { id } = await props.params;
  const subsIds = decodeURIComponent(id).split(",");
  const substances: Substance[] = await getSubstancesNames(subsIds) ?? [];
  if (!hasAllSubstances(subsIds, substances)) {
    return {
      title: `Substance ${id}`,
    };
  }

  const [definitionsRaw, allSpecsGroups] = await Promise.all([
    getSubstanceDefinition(subsIds),
    getSubstanceSpecsGroups(subsIds),
  ]);
  const definitionString = definitionsRaw.map(d => `${d.SA} : ${d.Definition}`).join(" - ");
  const { title } = getSubstancesPageNames(subsIds, substances, allSpecsGroups);

  return {
    title: `${title} - ${(await parent).title?.absolute}`,
    description: definitionString,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const subsIds = decodeURIComponent(id).split(",");
  
  const substances: Substance[] = await getSubstancesNames(subsIds) ?? [];
  if (!hasAllSubstances(subsIds, substances)) notFound();

  const [articles, definitions, allSpecsGroups] = await Promise.all([
    getArticlesFromSubstances(subsIds),
    getSubstanceDefinition(subsIds),
    getSubstanceSpecsGroups(subsIds),
  ]);
  const definition = definitions.map((d) => ({ title: d.SA, desc: d.Definition }));

  const dataList = allSpecsGroups.length > 0
    ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
    : [];

  const { title, subtitle } = getSubstancesPageNames(subsIds, substances, allSpecsGroups);
  
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
