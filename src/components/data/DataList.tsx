"use client";
import { HTMLAttributes, useEffect, useState } from "react";
import { AdvancedATCClass, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import DataBlockGeneric from "./DataBlockGeneric";
import DataBlockAccordion from "./DataBlockAccordion";
import { PathologyResume } from "@/types/Pathology";

interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  dataList: AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | PathologyResume[] | AdvancedATCClass[];
  type: DataTypeEnum;
  paginationLength: number;
  currentPage: number;
}

function DataList({
  dataList,
  type,
  paginationLength,
  currentPage,
}: DataListProps) {

  const [currentDataList, setCurrentDataList] = useState<AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | PathologyResume[] | AdvancedATCClass[]>(dataList);
  const [currentType, setCurrentType] = useState<DataTypeEnum>();

  useEffect(() => {
    if(type) 
      setCurrentType(type);
    else 
      setCurrentType(undefined);
  }, [type, setCurrentType]);

  useEffect(() => {
    if(dataList && paginationLength && paginationLength > 0) {
      const list = dataList.slice(
        (currentPage - 1) * paginationLength,
        currentPage * paginationLength,
      );
      setCurrentDataList(list);
    } else setCurrentDataList(dataList);
  }, [currentPage, setCurrentDataList]);
  
  return (
    <>
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
    </>
  );
};

export default DataList;
