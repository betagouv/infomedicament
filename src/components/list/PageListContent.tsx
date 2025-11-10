"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AlphabeticNav from "@/components/AlphabeticNav";
import DataList from "@/components/data/DataList";
import { HTMLAttributes, useEffect, useState } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import DataListPagination from "../data/DataListPagination";
import { ResumeGeneric, ResumePatho, ResumeSubstance } from "@/db/types";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import GenericAccordion from "../GenericAccordion";

interface PageListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letters: string[];
  urlPrefix: string;
  dataList: ResumeSubstance[] |  ResumePatho[] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[];
  type: DataTypeEnum;
  currentLetter: string;
  isGeneric?: boolean;
}

function PageListContent({
  title,
  letters,
  urlPrefix,
  dataList,
  type,
  currentLetter,
  isGeneric,
}: PageListContentProps ) {

  const PAGINATION_LENGTH:number = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentDataList, setCurrentDataList] = useState<ResumeSubstance[] | ResumePatho[] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[]>([]);

  useEffect(() => {
    setCurrentDataList(dataList);
  }, [dataList, setCurrentDataList]);
  
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-md-8")}>
        <h1 className={fr.cx("fr-h1", "fr-mb-8w")}>{title}</h1>
        {isGeneric && (
          <GenericAccordion className={fr.cx("fr-mb-4w")} />
        )}
        <AlphabeticNav
          letters={letters}
          url={(letter) => `${urlPrefix}${letter}`}
          currentLetter={currentLetter}
        />
      </div>
      <div className={fr.cx("fr-col-md-8")}>
        <DataList 
          dataList={currentDataList}
          type={type}
          paginationLength={PAGINATION_LENGTH}
          currentPage={currentPage}
          isGeneric={isGeneric || false}
        />
      </div>
      <DataListPagination 
        dataLength={dataList.length}
        paginationLength={PAGINATION_LENGTH}
        updateCurrentPage={setCurrentPage}
      />
    </div>
  );
}

export default PageListContent;