"use client";

import * as Sentry from "@sentry/nextjs";
import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import PageDefinitionContent from "./PageDefinitionContent";
import { groupSpecialites } from "@/utils/specialites";
import { ATC1, ATCSubsSpecs } from "@/types/ATCTypes";
import { getAtc1DefinitionData } from "@/db/utils/atc";
import { getArticlesFromATC } from "@/db/utils/articles";

interface ATC1DefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  atc: ATC1;
}

function ATC1DefinitionContent({
  atc,
}: ATC1DefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [allATC, setAllATC] = useState<ATCSubsSpecs[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(async () => {
    try {
      const [articles, allATC] = await Promise.all([
        getArticlesFromATC(atc.code),
        getAtc1DefinitionData(atc),
      ]);
      setArticles(articles);
      setAllATC(allATC);
    } catch (e) {
      Sentry.captureException(e);
    }
  }, [atc, setArticles, setAllATC]);

  useEffect(() => {
    loadDefinitionData();
  }, [atc, loadDefinitionData]);

  const dataList: AdvancedATCClass[] = useMemo(() => {
    if (allATC) {
      const filteredATC: AdvancedATCClass[] = allATC.map((atcSubsSpecs: ATCSubsSpecs) => {
        let nbSubs = 0;
        atcSubsSpecs.substances.forEach((sub) => {
          const subSepcs = atcSubsSpecs.specialites
            .filter((spec: SpecialiteWithSubstance) => spec.NomId.trim() === sub.NomId.trim());
          const specialitiesGroups = groupSpecialites(subSepcs);
          if (specialitiesGroups.length > 0) nbSubs++;
        });
        return {
          class: {
            nbSubstances: nbSubs,
            ...atcSubsSpecs.atc,
            children: atcSubsSpecs.atc.children ? atcSubsSpecs.atc.children : []
          },
          subclasses: [],
        }
      });
      return filteredATC.filter((data) => data.class.nbSubstances > 0);
    }
    return [];
  }, [allATC]);

  useEffect(() => {
    if (atc && dataList) {
      setTitle(`${dataList.length.toString()} ${(
        dataList.length > 1 ? "sous-classes de médicament" : "sous-classe de médicament"
      )}`);
    }
  }, [atc, dataList, setTitle]);

  return (
    <PageDefinitionContent
      title={title}
      definition={atc.description}
      definitionType="Classe de médicament"
      definitionTitle={atc.label}
      dataList={dataList}
      dataType={DataTypeEnum.ATCCLASS}
      articles={articles}
      articleTrackingFrom="Page ATC1"
    />
  );
};

export default ATC1DefinitionContent;
