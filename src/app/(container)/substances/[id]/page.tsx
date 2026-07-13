import { fr } from "@codegouvfr/react-dsfr";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { Metadata, ResolvingMetadata } from "next";
import { getSubstances, getSubstanceDefinition } from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";
import { getArticlesFromSubstances } from "@/db/utils/articles";
import { getResumeSpecsGroupsWithCIS, getSubstanceSpecialitesCIS } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { getSubstanceMainName } from "@/utils/susbtances";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {

  const { id } = await props.params;
  const subsIds = decodeURIComponent(id).split(",");
  const substances: SubstanceNom[] = await getSubstances(subsIds) ?? [];
  if (substances.length < subsIds.length) {
    return {
      title: `Substance ${id}`,
    };
  }

  const definitionsRaw = await getSubstanceDefinition(subsIds);
  const definitionString = definitionsRaw.map(d => `${d.SA} : ${d.Definition}`).join(" - ");

  return {
    title: `${substances.map((s) => s.NomLib).join(", ")} - ${(await parent).title?.absolute}`,
    description: definitionString,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const subsIds = decodeURIComponent(id).split(",");

  const substances: SubstanceNom[] = await getSubstances(subsIds) ?? [];
  if (substances.length < subsIds.length) return notFound();

  const [articles, definitions, CISList] = await Promise.all([
    getArticlesFromSubstances(subsIds),
    getSubstanceDefinition(subsIds),
    getSubstanceSpecialitesCIS(subsIds),
  ]);

  const definition = definitions.map((d) => ({ title: d.SA, desc: d.Definition }));

  const allSpecsGroups = await getResumeSpecsGroupsWithCIS(CISList);
  const dataList = allSpecsGroups.length > 0
    ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
    : [];

  const titles: string[] = subsIds.map((subsId) => getSubstanceMainName(substances.filter((subs) => subs.SubsId.trim() === subsId)));
  const title: string = titles.join(", ");
  console.log(substances);
  const subtitle = subsIds.map(
    (subsId) => substances
      .filter((subs) => 
        subs.SubsId.trim() === subsId && titles.findIndex((name) => subs.NomLib.trim() === name) === -1
      )
      .map((subs) => subs.NomLib.trim())
      .join(", ")
  ).join(", ");
  
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
