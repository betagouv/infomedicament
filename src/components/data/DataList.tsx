"use client";
import { HTMLAttributes } from "react";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import DataBlockGeneric from "./DataBlockGeneric";
import DataBlockAccordion from "./DataBlockAccordion";
import { ResumeGeneric, ResumeIndication, ResumeSubstance } from "@/db/types";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

function getCurrentDataList(
  dataList: ResumeSubstance[] | ResumeIndication [] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[],
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
  dataList: ResumeSubstance[] | ResumeIndication[] | ResumeSpecGroup[] | AdvancedATCClass[] | ResumeGeneric[];
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

  const dataListForPage = getCurrentDataList(dataList, paginationLength, currentPage);

  return (
    <>
      {type && dataListForPage && dataListForPage.map((data, index) => {
        return ( 
          (!isGeneric && type === DataTypeEnum.MEDICAMENT)
          ? (
            <DataBlockAccordion
              key={index}
              item={data as ResumeSpecGroup}
            />
          ) : (
            <DataBlockGeneric
              key={index}
              type={type}
              item={data as ResumeSubstance | ResumeIndication | AdvancedATCClass | ResumeGeneric}
            />
          )
        )
      })}
    </>
  );
};

export default DataList;
