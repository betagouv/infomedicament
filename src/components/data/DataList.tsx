"use client";
import { HTMLAttributes, useEffect, useState } from "react";
import { AdvancedATCClass, AdvancedPatho, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import DataBlockGeneric from "./DataBlockGeneric";
import DataBlockAccordion from "./DataBlockAccordion";


interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  dataList: AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | AdvancedPatho[] | AdvancedATCClass[];
  type: DataTypeEnum;
}

function DataList({
  dataList,
  type,
}: DataListProps) {

  const [currentDataList, setCurrentDataList] = useState<AdvancedSubstanceNom[] | AdvancedMedicamentGroup[] | AdvancedPatho[] | AdvancedATCClass[]>([]);
  const [currentType, setCurrentType] = useState<DataTypeEnum>();

  useEffect(() => {
    if(dataList)
      setCurrentDataList(dataList);
    else 
      setCurrentDataList([]);
  }, [dataList, setCurrentDataList]);

  useEffect(() => {
    if(type) 
      setCurrentType(type);
    else 
      setCurrentType(undefined);
  }, [type, setCurrentType]);
  
  return (
    <div>
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
  );
};

export default DataList;
