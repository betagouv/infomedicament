"use client";

import { fr } from "@codegouvfr/react-dsfr";
import React, { HTMLAttributes, useEffect, useState } from "react";
import DefinitionBanner from "@/components/DefinitionBanner";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";
import ArticlesSearchList from "@/components/articles/ArticlesSearchList";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import DataListPagination from "../data/DataListPagination";
import { SubstanceResume } from "@/types/SubstanceTypes";

interface PageDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  definition: string | { title: string; desc: string }[];
  definitionType: string;
  definitionTitle: string;
  definitionDisclaimer?: string;
  dataList: SubstanceResume[] | AdvancedMedicamentGroup[] | AdvancedATCClass[];
  dataType: DataTypeEnum;
  articles: ArticleCardResume[];
}

function PageDefinitionContent({
    title,
    definition,
    definitionType,
    definitionTitle,
    definitionDisclaimer,
    dataList,
    dataType,
    articles,
  }: PageDefinitionContentProps) {

  const PAGINATION_LENGTH = 10;
  const [currentDefinition, setCurrentDefinition] = useState<string | { title: string; desc: string }[]>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentDataList, setCurrentDataList] = useState<SubstanceResume[] | AdvancedMedicamentGroup[] | AdvancedATCClass[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>();
  const [currentArticles, setCurrentArticles] = useState<ArticleCardResume[]>();

  useEffect(() => {
    setCurrentTitle(title);
  }, [title, setCurrentTitle]);

  useEffect(() => {
    setCurrentDefinition(definition);
  }, [definition, setCurrentDefinition]);

  useEffect(() => {
    setCurrentDataList(dataList);
  }, [dataList, setCurrentDataList]);

  useEffect(() => {
    setCurrentArticles(articles);
  }, [articles, setCurrentArticles]);

  return (
    <div className={fr.cx("fr-grid-row")} style={{justifyContent: "space-between"}}>
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <DefinitionBanner
          type={definitionType}
          title={definitionTitle}
          definition={currentDefinition}
          disclaimer={definitionDisclaimer}
        />
        <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
          {currentTitle}
        </h2>
      </div>
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <DataList
          dataList={currentDataList}
          type={dataType}
          paginationLength={PAGINATION_LENGTH}
          currentPage={currentPage}
        />
      </div>
      {(currentArticles && currentArticles.length > 0) && (
        <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
          <ArticlesSearchList 
            articles={currentArticles} />
        </div>
      )}
      <DataListPagination
        dataLength={currentDataList.length}
        paginationLength={PAGINATION_LENGTH}
        updateCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default PageDefinitionContent;
