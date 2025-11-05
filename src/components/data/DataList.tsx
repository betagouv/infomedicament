"use client";
import { HTMLAttributes, useEffect, useState } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import DataBlockGeneric from "./DataBlockGeneric";
import DataBlockAccordion from "./DataBlockAccordion";
import { ResumeGeneric, ResumePatho, ResumeSubstance } from "@/db/types";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

function getCurrentDataList(
  dataList: ResumeSubstance[] | ResumePatho [] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[],
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
  dataList: ResumeSubstance[] | ResumePatho[] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[];
  type: DataTypeEnum;
  paginationLength: number;
  currentPage: number;
  isGeneric?: boolean;
}

function DataList({
  dataList,
  type,
  paginationLength,
  currentPage,
  isGeneric,
}: DataListProps) {

  const [currentDataList, setCurrentDataList] = useState<ResumeSubstance[] | ResumePatho[] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[]>([]);
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
          (!isGeneric && (type === DataTypeEnum.MEDICAMENT || type === DataTypeEnum.EXPIRED))
          ? (
            <DataBlockAccordion
              key={index}
              item={data as ResumeSpecGroup}
            />
          ) : (
            <DataBlockGeneric
              key={index}
              type={currentType}
              item={data as ResumeSubstance | ResumePatho | AdvancedATCClass | ResumeGeneric}
            />
          )
        )
      })}
    </>
  );
};

export default DataList;
