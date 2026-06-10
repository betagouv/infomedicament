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

export const dynamic = "error";
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {

  const { id } = await props.params;
  const ids = decodeURIComponent(id).split(",");//NomId
  const substances: SubstanceNom[] = await getSubstances(ids) ?? [];
  if (substances.length < ids.length) return notFound();

  const definitionsRaw = await getSubstanceDefinition(ids, substances.map((subs) => subs.SubsId.trim()));
  const definitionString = definitionsRaw.map(d => `${d.SA} : ${d.Definition}`).join(" - ")

  return {
    title: `${substances.map((s) => s.NomLib).join(", ")} - ${(await parent).title?.absolute}`,
    description: definitionString,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ids = decodeURIComponent(id).split(",");//NomId

  const substances: SubstanceNom[] = await getSubstances(ids) ?? [];
  if (substances.length < ids.length) return notFound();

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
