"use client";

import { HTMLAttributes } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import PageDefinitionContent from "./PageDefinitionContent";
import { ATC } from "@/types/ATCTypes";
import { ResumeSubstance } from "@/db/types";

interface ATC2DefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  atc: ATC;
  articles: ArticleCardResume[];
  dataList: ResumeSubstance[];
}

function ATC2DefinitionContent({ atc, articles, dataList }: ATC2DefinitionContentProps) {
  const title = `${dataList.length} ${dataList.length > 1 ? "substances actives" : "substance active"}`;

  return (
    <PageDefinitionContent
      title={atc.label}
      definition={atc.description}
      definitionType="Sous-classe de médicament"
      listTitle={title}
      dataList={dataList}
      dataType={DataTypeEnum.SUBSTANCE}
      articles={articles}
      articleTrackingFrom="Page ATC2"
    />
  );
};

export default ATC2DefinitionContent;
