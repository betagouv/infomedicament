"use client";

import * as Sentry from "@sentry/nextjs";
import React, { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { getArticlesFromSubstances } from "@/data/grist/articles";
import { getSubstanceDefinition } from "@/data/grist/substances";
import PageDefinitionContent from "./PageDefinitionContent";
import { getSubstanceSpecialites } from "@/db/utils/search";
import { groupSpecialites } from "@/utils/specialites";
import { getAdvancedMedicamentFromGroup } from "@/db/utils/medicaments";

interface SubstanceDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  ids: string[];
  substances: SubstanceNom[];
}

function SubstanceDefinitionContent({
    ids,
    substances,
  }: SubstanceDefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [definition, setDefinition] = useState<string | { title: string; desc: string }[]>("");
  const [dataList, setDataList] = useState<AdvancedMedicamentGroup[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        const newArticles: ArticleCardResume[] = await getArticlesFromSubstances(ids);
        setArticles(newArticles);

        const subsIds = substances.map((subs: SubstanceNom) => (subs.SubsId).trim());
        const definitions = await getSubstanceDefinition(ids, subsIds);
        setDefinition(definitions.map((d: any) => ({
          title: d.fields.SA,
          desc: d.fields.Definition,
        })));

        const specialites: Specialite[] = await getSubstanceSpecialites(ids);
        const medicaments = (specialites.length > 0) ? (groupSpecialites(specialites, true)) : [];
        const detailedMedicaments = (medicaments.length > 0) ? (await getAdvancedMedicamentFromGroup(medicaments)) : [];
        setDataList(detailedMedicaments);
      } catch(e) {
        Sentry.captureException(e);
      }
  },[ids, substances, setArticles, setDefinition, setDataList]);

  useEffect(() => {
    loadDefinitionData();
  }, [ids, substances, loadDefinitionData]);

  useEffect(() => {
    if(substances && dataList) {
        setTitle(`${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} contenant 
          ${substances.length < 2
            ? `uniquement la substance « ${substances[0].NomLib} »`
            : `les substances « ${substances.map((s) => s.NomLib).join(", ")} »`}`);
    }
  }, [substances, dataList, setTitle]);

  return (
    <PageDefinitionContent
      title={title}
      definition={definition}
      definitionType={`Substance${ids.length > 1 ? "s" : ""} active${ids.length > 1 ? "s" : ""}`}
      definitionTitle={substances.map((s) => s.NomLib).join(", ")}
      definitionDisclaimer={"Les définitions proposées sont fournies à titre informatif. Elles n'ont pas de valeur d'avis médical ou d’indication clinique. En cas de doute ou pour toute décision liée à votre santé, consultez un professionnel de santé."}
      dataList={dataList}
      dataType={DataTypeEnum.MEDGROUP}
      articles={articles}
    />
  );
};

export default SubstanceDefinitionContent;
