"use client";
import { HTMLAttributes, useEffect, useState } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import DataBlockGeneric from "./DataBlockGeneric";
import DataBlockAccordion from "./DataBlockAccordion";
import { ResumePatho, ResumeSubstance } from "@/db/types";

function getCurrentDataList(
  dataList: ResumeSubstance[] | AdvancedMedicamentGroup[] | ResumePatho [] | AdvancedATCClass[],
  paginationLength: number,
  currentPage: number,
){
  if(dataList && dataList.length > 0 && paginationLength && paginationLength > 0) {
    const list = dataList.slice(
      (currentPage - 1) * paginationLength,
      currentPage * paginationLength,
    );
    return list;
  }
  return [];
}

interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  dataList: ResumeSubstance[] | AdvancedMedicamentGroup[] | ResumePatho[] | AdvancedATCClass[];
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

  const [currentDataList, setCurrentDataList] = useState<ResumeSubstance[] | AdvancedMedicamentGroup[] | ResumePatho[] | AdvancedATCClass[]>([]);
  const [currentType, setCurrentType] = useState<DataTypeEnum>();

  useEffect(() => {
    if(type) 
      setCurrentType(type);
    else 
      setCurrentType(undefined);
  }, [type, setCurrentType]);

  useEffect(() => {
    const list = getCurrentDataList(dataList, paginationLength, currentPage);
    setCurrentDataList(list);
  }, [dataList, paginationLength, currentPage, setCurrentDataList]);
  
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
