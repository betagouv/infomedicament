"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { getArticlesFromPatho } from "@/db/utils/articles";
import PageDefinitionContent from "./PageDefinitionContent";
import { getResumeSpecsGroupsWithIndication } from "@/db/utils/specialities";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { Indication } from "@/db/types";

interface IndicationDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  indication: Indication;
}

function IndicationDefinitionContent({
  indication,
}: IndicationDefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [dataList, setDataList] = useState<ResumeSpecGroup[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        if(indication.codePatho) {
          const newArticles: ArticleCardResume[] = await getArticlesFromPatho(indication.codePatho);
          setArticles(newArticles);
        }

        const newAllSpecsGroups = await getResumeSpecsGroupsWithIndication(indication.id);
        if (newAllSpecsGroups.length > 0) {
          const allSpecsWithATC: ResumeSpecGroup[] = await getResumeSpecsGroupsATCLabels(newAllSpecsGroups);
          setDataList(allSpecsWithATC);
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }, [indication, setArticles, setDataList]);

  useEffect(() => {
    loadDefinitionData();
  }, [indication, loadDefinitionData]);

  useEffect(() => {
    if (indication && dataList) {
      setTitle(`${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} traitant l'indication « 
          ${indication.nom} »`);
    }
  }, [indication, dataList, setTitle]);

  return (
    <PageDefinitionContent
      title={title}
      definition={indication.definition}
      definitionType="Indication"
      definitionTitle={indication.nom}
      dataList={dataList}
      dataType={DataTypeEnum.MEDICAMENT}
      articles={articles}
      articleTrackingFrom="Page indication"
    />
  );
};

export default IndicationDefinitionContent;
