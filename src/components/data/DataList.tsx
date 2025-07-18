"use client";
import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { AdvancedATCClass, AdvancedPatho, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import DataBlockGeneric from "./DataBlockGeneric";
import DataBlockAccordion from "./DataBlockAccordion";
import Pagination from "@codegouvfr/react-dsfr/Pagination";

interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  dataList: AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | AdvancedPatho[] | AdvancedATCClass[];
  type: DataTypeEnum;
  paginationLength?: number;
}

function DataList({
  dataList,
  type,
  paginationLength,
}: DataListProps) {

  const [currentDataList, setCurrentDataList] = useState<AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | AdvancedPatho[] | AdvancedATCClass[]>([]);
  const [currentType, setCurrentType] = useState<DataTypeEnum>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentPageCount, setCurrentPageCount] = useState<number>(1);

  useEffect(() => {
    if(dataList) {
      if(paginationLength && paginationLength > 0){ 
        const pageCount =
          Math.trunc(dataList.length / paginationLength) +
          (dataList.length % paginationLength ? 1 : 0);
        setCurrentPageCount(pageCount);
        const list = dataList.slice(
          (currentPage - 1) * paginationLength,
          currentPage * paginationLength,
        );
        setCurrentDataList(list);
      }
      else setCurrentDataList(dataList);
    } else {
      setCurrentDataList([]);
      setCurrentPageCount(1);
    }
  }, [dataList, setCurrentDataList, setCurrentPageCount]);

  useEffect(() => {
    if(type) 
      setCurrentType(type);
    else 
      setCurrentType(undefined);
  }, [type, setCurrentType]);

  function onPaginationChange(pageNumber:number) {
    if(paginationLength && paginationLength > 0){ 
      const list = dataList.slice(
        (pageNumber - 1) * paginationLength,
        pageNumber * paginationLength,
      );
      setCurrentDataList(list);
      setCurrentPage(pageNumber);
    } else {
      setCurrentDataList(dataList);
      setCurrentPage(1);
    }
  }
  
  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-md-8")}>
        {currentType && currentDataList && currentDataList.map((data, index) => {
          return ( 
            type !== DataTypeEnum.MEDGROUP 
            ? (
              <DataBlockGeneric
                key={index}
                item={{
                  result: data,
                  type: currentType,
                }}
              />
            ) : (
              <DataBlockAccordion
                key={index}
                item={data as AdvancedMedicamentGroup}
              />
            )
          )
        })}
      </div>
      {(paginationLength && paginationLength > 0 && currentPageCount > 1) && (
        <div className={fr.cx("fr-col-12")}>
          <Pagination
            className={fr.cx("fr-mt-1w")}
            count={currentPageCount}
            defaultPage={currentPage}
            getPageLinkProps={(page: number) => ({
              onClick: () => onPaginationChange(page),
              href: '#',
            })}
          />
        </div>
      )}
    </div>
  );
};

export default DataList;
