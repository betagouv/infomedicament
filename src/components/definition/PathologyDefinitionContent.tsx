"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { getArticlesFromPatho } from "@/db/utils/articles";
import PageDefinitionContent from "./PageDefinitionContent";
import { getResumeSpecsGroupsWithPatho } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { Pathology } from "@/db/types";

interface PathologyDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  patho: Pathology;
}

function PathologyDefinitionContent({
  patho,
}: PathologyDefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [dataList, setDataList] = useState<ResumeSpecGroup[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        if(patho.codePatho) {
          const newArticles: ArticleCardResume[] = await getArticlesFromPatho(patho.codePatho);
          setArticles(newArticles);
        }

        const newAllSpecsGroups = await getResumeSpecsGroupsWithPatho(patho.id);
        if (newAllSpecsGroups.length > 0) {
          const allSpecsWithATC: ResumeSpecGroup[] = await getResumeSpecsGroupsATCLabels(newAllSpecsGroups);
          setDataList(allSpecsWithATC);
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }, [patho, setArticles, setDataList]);

  useEffect(() => {
    loadDefinitionData();
  }, [patho, loadDefinitionData]);

  useEffect(() => {
    if (patho && dataList) {
      setTitle(`${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} traitant la pathologie « 
          ${patho.nom} »`);
    }
  }, [patho, dataList, setTitle]);

  return (
    <PageDefinitionContent
      title={title}
      definition={patho.definition}
      definitionType="Pathologie"
      definitionTitle={patho.nom}
      dataList={dataList}
      dataType={DataTypeEnum.MEDICAMENT}
      articles={articles}
      articleTrackingFrom="Page pathologie"
    />
  );
};

export default PathologyDefinitionContent;
