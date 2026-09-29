"use client";

import { HTMLAttributes } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import PageDefinitionContent from "./PageDefinitionContent";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { Indication } from "@/db/types";

interface IndicationDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  indication: Indication;
  articles: ArticleCardResume[];
  dataList: ResumeSpecGroup[];
}

function IndicationDefinitionContent({ indication, articles, dataList }: IndicationDefinitionContentProps) {
  const title = `${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} traitant l'indication « ${indication.nom} »`;

  return (
    <PageDefinitionContent
      title={indication.nom}
      definition={indication.definition}
      definitionType="Indication"
      listTitle={title}
      dataList={dataList}
      dataType={DataTypeEnum.MEDICAMENT}
      articles={articles}
      articleTrackingFrom="Page indication"
    />
  );
};

export default IndicationDefinitionContent;
