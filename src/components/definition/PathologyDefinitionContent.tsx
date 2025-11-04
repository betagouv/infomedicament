"use client";

import * as Sentry from "@sentry/nextjs";
import React, { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { Patho } from "@/db/pdbmMySQL/types";
import { getArticlesFromPatho } from "@/data/grist/articles";
import PageDefinitionContent from "./PageDefinitionContent";
import { getPathologyDefinition } from "@/data/grist/pathologies";
import { getResumeSpecialitesWithPatho } from "@/db/utils/specialities";
import { getResumeSpecsATCLabels } from "@/data/grist/atc";
import { ResumeSpecialite } from "@/types/SpecialiteTypes";

interface PathologyDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  patho: Patho;
}

function PathologyDefinitionContent({
    patho,
  }: PathologyDefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [definition, setDefinition] = useState<string | { title: string; desc: string }[]>("");
  const [dataList, setDataList] = useState<ResumeSpecialite[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        const newArticles: ArticleCardResume[] = await getArticlesFromPatho(patho.codePatho);
        setArticles(newArticles);

        const definition = await getPathologyDefinition(patho.codePatho);
        setDefinition(definition);

        const newAllSpecs = await getResumeSpecialitesWithPatho(patho.codePatho);
        if(newAllSpecs.length > 0){
          const allSpecsWithATC: ResumeSpecialite[] = await getResumeSpecsATCLabels(newAllSpecs);
          setDataList(allSpecsWithATC);
        }
      } catch(e) {
        Sentry.captureException(e);
      }
  },[patho, setArticles, setDefinition, setDataList]);

  useEffect(() => {
    loadDefinitionData();
  }, [patho, loadDefinitionData]);

  useEffect(() => {
    if(patho && dataList) {
        setTitle(`${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} traitant la pathologie « 
          ${patho.NomPatho} »`);
    }
  }, [patho, dataList, setTitle]);

  return (
    <PageDefinitionContent
      title={title}
      definition={definition}
      definitionType="Pathologie"
      definitionTitle={patho.NomPatho}
      dataList={dataList}
      dataType={DataTypeEnum.MEDGROUP}
      articles={articles}
      articleTrackingFrom="Page pathologie"
    />
  );
};

export default PathologyDefinitionContent;
