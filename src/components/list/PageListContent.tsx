"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AlphabeticNav from "@/components/AlphabeticNav";
import DataList from "@/components/data/DataList";
import { HTMLAttributes, useEffect, useState } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import DataListPagination from "../data/DataListPagination";
import { ResumePatho, ResumeSubstance } from "@/db/types";
import { ResumeSpecialite } from "@/types/SpecialiteTypes";

interface PageListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letters: string[];
  urlPrefix: string;
  dataList: ResumeSubstance[] |  ResumePatho[] | AdvancedMedicamentGroup[] | ResumeSpecialite[] | AdvancedATCClass[];
  type: DataTypeEnum;
  currentLetter: string;
}

function PageListContent({
  title,
  letters,
  urlPrefix,
  dataList,
  type,
  currentLetter,
}: PageListContentProps ) {

  const PAGINATION_LENGTH:number = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentDataList, setCurrentDataList] = useState<ResumeSubstance[] | ResumePatho[] | AdvancedMedicamentGroup[] | ResumeSpecialite[] | AdvancedATCClass[]>([]);

  useEffect(() => {
    setCurrentDataList(dataList);
  }, [dataList, setCurrentDataList]);
  
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-md-8")}>
        <h1 className={fr.cx("fr-h1", "fr-mb-8w")}>{title}</h1>
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