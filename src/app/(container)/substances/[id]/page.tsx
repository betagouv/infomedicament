import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSubstances, getSubstanceDefinition } from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";
import { getArticlesFromSubstances } from "@/db/utils/articles";
import { getResumeSpecsGroupsWithCIS, getSubstanceSpecialitesCIS } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ids = decodeURIComponent(id).split(",");

  const substances: SubstanceNom[] = await getSubstances(ids) ?? [];
  if (!substances || substances.length < ids.length) return notFound();
  if (substances.some((s) => !s.NomLib)) return notFound();

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
