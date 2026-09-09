"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useState } from "react";
import DefinitionBanner from "@/components/DefinitionBanner";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";
import ArticlesSearchList from "@/components/articles/ArticlesSearchList";
import { ArticleCardResume, ArticleTrackingFromType } from "@/types/ArticlesTypes";
import DataListPagination from "../data/DataListPagination";
import { ResumeSubstance } from "@/db/types";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

interface PageDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  definition: string | { title: string; desc: string }[];
  definitionType: string;
  definitionDisclaimer?: string;
  listTitle: string;
  dataList: ResumeSubstance[] | ResumeSpecGroup[] | AdvancedATCClass[];
  dataType: DataTypeEnum;
  articles: ArticleCardResume[];
  articleTrackingFrom: ArticleTrackingFromType;
}

function PageDefinitionContent({
    title,
    subtitle,
    definition,
    definitionType,
    definitionDisclaimer,
    listTitle,
    dataList,
    dataType,
    articles,
    articleTrackingFrom,
  }: PageDefinitionContentProps) {

  const PAGINATION_LENGTH = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  return (
    <div className={fr.cx("fr-grid-row")} style={{justifyContent: "space-between"}}>
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <DefinitionBanner
          type={definitionType}
          title={title}
          subtitle={subtitle}
          definition={definition}
          disclaimer={definitionDisclaimer}
        />
        <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
          {listTitle}
        </h2>
      </div>
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <DataList
          dataList={dataList}
          type={dataType}
          paginationLength={PAGINATION_LENGTH}
          currentPage={currentPage}
        />
      </div>
      {(articles && articles.length > 0) && (
        <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
          <ArticlesSearchList 
            articles={articles} 
            trackingFrom={articleTrackingFrom}
          />
        </div>
      )}
      <DataListPagination
        dataLength={dataList.length}
        paginationLength={PAGINATION_LENGTH}
        updateCurrentPage={setCurrentPage}
      />
    </div>
  );
};

export default PageDefinitionContent;
