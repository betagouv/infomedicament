import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { groupSpecialites } from "@/db/utils";
import { Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { notFound } from "next/navigation";
import { getGristTableData } from "@/data/grist";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import { getAdvancedMedicamentFromGroup } from "@/db/utils/medicaments";
import { DataTypeEnum } from "@/types/DataTypes";
import { getSubstanceSpecialites } from "@/db/utils/search";
import PageDefinitionContent from "@/components/generic/PageDefinitionContent";
import { getArticlesFromSubstances } from "@/data/grist/articles";
import RatingToaster from "@/components/rating/RatingToaster";

export const dynamic = "error";
export const dynamicParams = true;

async function getSubstance(ids: string[]) {
  const substances: SubstanceNom[] | undefined = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where("NomId", "in", ids)
    .selectAll()
    .execute();

  if (!substances || substances.length < ids.length) return notFound();

  const specialites: Specialite[] = await getSubstanceSpecialites(ids);
  const specialitiesGroups = groupSpecialites(specialites, true);
  const subsIds = substances.map((subs: SubstanceNom) => (subs.SubsId).trim());
  const definitionsRaw = (
    await getGristTableData("Definitions_Substances_Actives", [
      "SubsId",
      "NomId",
      "SA",
      "Definition",
    ])
  );
  let definitions: any[] = [];
  if(definitionsRaw){
    definitions = definitionsRaw.filter((d) => ids.includes(d.fields.NomId as string)) as {
      fields: { NomId: string; SA: string; Definition: string };
    }[];
    if(definitions.length === 0){
      definitions = definitionsRaw.filter((d) => subsIds.includes((d.fields.SubsId as string).trim())) as {
        fields: { NomId: string; SA: string; Definition: string };
      }[];
    }
  }

  return {
    substances,
    specialitiesGroups,
    definitions,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const ids = decodeURIComponent(id).split(",");
  const { substances, specialitiesGroups, definitions } = await getSubstance(ids);

  const detailedSpecialitiesGroups = await getAdvancedMedicamentFromGroup(specialitiesGroups);
  const articles = await getArticlesFromSubstances(ids);

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
      <PageDefinitionContent 
        definitionType={`Substance${ids.length > 1 ? "s" : ""} active${ids.length > 1 ? "s" : ""}`}
        definitionTitle={substances.map((s) => s.NomLib).join(", ")}
        definition={definitions.map((d) => ({
              title: d.fields.SA,
              desc: d.fields.Definition,
            }))}
        definitionDisclaimer={"Les définitions proposées sont fournies à titre informatif. Elles n'ont pas de valeur d'avis médical ou d’indication clinique. En cas de doute ou pour toute décision liée à votre santé, consultez un professionnel de santé."}
        title={`${specialitiesGroups.length} ${specialitiesGroups.length > 1 ? "médicaments" : "médicament"} contenant 
            ${substances.length < 2
              ? `uniquement la substance « ${substances[0].NomLib} »`
              : `les substances « ${substances.map((s) => s.NomLib).join(", ")} »`}`}
        dataList={detailedSpecialitiesGroups}
        dataType={DataTypeEnum.MEDGROUP}
        articles={articles}
      />
      <RatingToaster
        pageId={substances.map((s) => s.NomLib).join(", ")}
      />
    </ContentContainer>
  );
}
