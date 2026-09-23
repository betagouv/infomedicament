"use client";

import { HTMLAttributes } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import PageDefinitionContent from "./PageDefinitionContent";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

interface SubstanceDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  subsIds: string[];
  articles: ArticleCardResume[];
  definition: string | { title: string; desc: string }[];
  dataList: ResumeSpecGroup[];
  title: string;
  subtitle?: string;
}

function SubstanceDefinitionContent({ 
  subsIds, 
  articles, 
  definition, 
  dataList,
  title,
  subtitle
}: SubstanceDefinitionContentProps) {

  const listTitle = `${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} contenant ${
    subsIds.length < 2
      ? `uniquement la substance « ${title} »`
      : `les substances « ${title} »`
  }`;

  return (
    <PageDefinitionContent
      title={title}
      subtitle={subtitle}
      definition={definition}
      definitionType={`Substance${subsIds.length > 1 ? "s" : ""} active${subsIds.length > 1 ? "s" : ""}`}
      definitionDisclaimer={"Les définitions proposées sont fournies à titre informatif. Elles n'ont pas de valeur d'avis médical ou d’indication clinique. En cas de doute ou pour toute décision liée à votre santé, consultez un professionnel de santé."}
      listTitle={listTitle}
      dataList={dataList}
      dataType={DataTypeEnum.MEDICAMENT}
      articles={articles}
      articleTrackingFrom="Page substance"
    />
  );
};

export default SubstanceDefinitionContent;
