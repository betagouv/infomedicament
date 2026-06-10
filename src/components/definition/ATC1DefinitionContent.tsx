import React, { HTMLAttributes } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import PageDefinitionContent from "./PageDefinitionContent";
import { ATC1 } from "@/types/ATCTypes";

interface ATC1DefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  atc: ATC1;
  articles: ArticleCardResume[];
  dataList: AdvancedATCClass[];
}

function ATC1DefinitionContent({ atc, articles, dataList }: ATC1DefinitionContentProps) {
  const title = `${dataList.length} ${dataList.length > 1 ? "sous-classes de médicament" : "sous-classe de médicament"}`;

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
