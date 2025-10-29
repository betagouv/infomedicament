"use client";

import * as Sentry from "@sentry/nextjs";
import React, { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { getArticlesFromSubstances } from "@/data/grist/articles";
import PageDefinitionContent from "./PageDefinitionContent";
import { getResumeSpecsGroupsWithCIS, getSubstanceSpecialitesCIS } from "@/db/utils/specialities";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { getResumeSpecsGroupsATCLabels } from "@/data/grist/atc";

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
  const [dataList, setDataList] = useState<ResumeSpecGroup[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        const newArticles: ArticleCardResume[] = await getArticlesFromSubstances(ids);
        setArticles(newArticles);

        const CISList: string[] = await getSubstanceSpecialitesCIS(ids);
        const newAllSpecsGroups = await getResumeSpecsGroupsWithCIS(CISList);
        if(newAllSpecsGroups.length > 0){
          const allSpecsWithATC: ResumeSpecGroup[] = await getResumeSpecsGroupsATCLabels(newAllSpecsGroups);
          setDataList(allSpecsWithATC);
        }
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
