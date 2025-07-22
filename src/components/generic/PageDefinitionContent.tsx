"use client";

import { fr } from "@codegouvfr/react-dsfr";
import React, { HTMLAttributes, useState } from "react";
import DefinitionBanner from "@/components/DefinitionBanner";
import { AdvancedATCClass, AdvancedPatho, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";
import ArticlesSearchList from "@/components/articles/ArticlesSearchList";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import DataListPagination from "../data/DataListPagination";

interface PageDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  definitionType: string;
  definitionTitle: string;
  definition: string | { title: string; desc: string }[];
  definitionDisclaimer?: string;
  title: string;
  dataList: AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | AdvancedPatho[] | AdvancedATCClass[];
  dataType: DataTypeEnum;
  articles: ArticleCardResume[];
}

function PageDefinitionContent({
    definitionType,
    definitionTitle,
    definition,
    definitionDisclaimer,
    title,
    dataList,
    dataType,
    articles,
  }: PageDefinitionContentProps) {

  const PAGINATION_LENGTH = 10;

  const [currentPage, setCurrentPage] = useState<number>(1);

  return (
    <div className={fr.cx("fr-grid-row")} style={{justifyContent: "space-between"}}>
      <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
        <DefinitionBanner
          type={definitionType}
          title={definitionTitle}
          definition={definition}
          disclaimer={definitionDisclaimer}
        />

        <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
          {title}
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
            articles={articles} />
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
