"use client";

import * as Sentry from "@sentry/nextjs";
import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { SpecialiteWithSubstance } from "@/types/MedicamentTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { getArticlesFromATC } from "@/data/grist/articles";
import PageDefinitionContent from "./PageDefinitionContent";
import { groupSpecialites } from "@/utils/specialites";
import { ATC } from "@/types/ATCTypes";
import { getSubstancesByAtc } from "@/db/utils/atc";
import { getSubstanceAllSpecialites } from "@/db/utils/substances";
import { MedicamentGroup } from "@/displayUtils";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { SubstanceResume } from "@/types/SubstanceTypes";

interface ATC2DefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  atc: ATC;
}

function ATC2DefinitionContent({
    atc,
  }: ATC2DefinitionContentProps) {

  const [title, setTitle] = useState<string>("");
  const [substances, setSubstances] = useState<SubstanceNom[]>([]);
  const [specialites, setSpecialites] = useState<SpecialiteWithSubstance[]>([]);
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);

  const loadDefinitionData = useCallback(
    async () => {
      try {
        const newArticles: ArticleCardResume[] = await getArticlesFromATC(atc.code);
        setArticles(newArticles);

        const newSubstances = await getSubstancesByAtc(atc);
        setSubstances(newSubstances);
        const subsNomID: string[] = newSubstances
          .map((sub) => sub.NomId.trim())
          .filter((value, index, self) => self.indexOf(value) === index);
        const newSpecialites: any[] = await getSubstanceAllSpecialites(subsNomID);
        setSpecialites(newSpecialites);
      } catch(e) {
        Sentry.captureException(e);
      }
  },[atc, setArticles, setSubstances, setSpecialites]);

  useEffect(() => {
    loadDefinitionData();
  }, [atc, loadDefinitionData]);

  const dataList: SubstanceResume[] = useMemo(() => {
    if(specialites && substances) {
      const filterdSubs: SubstanceResume[] = substances.map((sub) => {
        const subSpecs = specialites
          .filter((spec: any) => spec.NomId.trim() === sub.NomId.trim() );
        const specialitiesGroups = groupSpecialites(subSpecs);
        return {
          medicaments: specialitiesGroups.map((spec: MedicamentGroup) => spec[0]),
          ...sub,
        }
      });
      return filterdSubs.filter((sub) => sub.medicaments.length > 0);
    }
    return [];          
  }, [specialites, substances]);

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
      dataList={dataList as SubstanceResume[]}
      dataType={DataTypeEnum.SUBSTANCE}
      articles={articles}
    />
  );
};

export default ATC2DefinitionContent;
