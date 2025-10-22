"use client";

import * as Sentry from "@sentry/nextjs";
import React, { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { getArticlesFromATC } from "@/data/grist/articles";
import PageDefinitionContent from "./PageDefinitionContent";
import { ATC } from "@/types/ATCTypes";
import { getSubstancesByAtc } from "@/db/utils/atc";
import { getSubstancesResume } from "@/db/utils/substances";
import { ResumeSubstance } from "@/db/types";

interface ATC2DefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  atc: ATC;
}

function ATC2DefinitionContent({
    atc,
  }: ATC2DefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [dataList, setDataList] = useState<ResumeSubstance[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        const newArticles: ArticleCardResume[] = await getArticlesFromATC(atc.code);
        setArticles(newArticles);

        const newSubstances = await getSubstancesByAtc(atc);
        const subsNomID: string[] = newSubstances
          .map((sub) => sub.NomId.trim())
          .filter((value, index, self) => self.indexOf(value) === index);
        const newDataList: ResumeSubstance[] = await getSubstancesResume(subsNomID);
        setDataList(newDataList);
      } catch(e) {
        Sentry.captureException(e);
      }
  },[atc, setArticles, setDataList]);

  useEffect(() => {
    loadDefinitionData();
  }, [atc, loadDefinitionData]);

  useEffect(() => {
    if(atc && dataList) {
      setTitle(`${dataList.length.toString()} ${(
        dataList.length > 1 ? "substances actives" : "substance active"
      )}`)
    }
  }, [atc, dataList, setTitle]);

  return (
    <PageDefinitionContent
      title={title}
      definition={atc.description}
      definitionType="Sous-classe de médicament"
      definitionTitle={atc.label}
      dataList={dataList}
      dataType={DataTypeEnum.SUBSTANCE}
      articles={articles}
    />
  );
};

export default ATC2DefinitionContent;
