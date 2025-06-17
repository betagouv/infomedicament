"use client";

import { Fragment, HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import styled from 'styled-components';
import DataBlockGeneric from "../data/DataBlockGeneric";
import DataBlockAccordion from "../data/DataBlockAccordion";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { AdvancedData, DataTypeEnum } from "@/types/DataTypes";

const TagContainer = styled.div `
  text-align: center;
`;
const ResultNumber = styled.span`
  font-weight: normal !important;
`;

interface ResultsListBlockProps extends HTMLAttributes<HTMLDivElement> {
  dataList: AdvancedData[];
  nbData: number;
  type: DataTypeEnum;
  filterPregnancy: boolean;
  filterPediatric: boolean;
  isAllList: boolean;
  setFilterCategory: (filterCategory: DataTypeEnum | boolean) => void;
}

const blockTitlesPlural = {
  [DataTypeEnum.MEDGROUP]: "Médicaments",
  [DataTypeEnum.SUBSTANCE]: "Substances actives",
  [DataTypeEnum.ATCCLASS]: "Classes et sous-classes",
  [DataTypeEnum.PATHOLOGY]: "Pathologies",
}

function ResultsListBlock({
  dataList,
  nbData,
  type,
  filterPregnancy,
  filterPediatric, 
  isAllList,
  setFilterCategory
}: ResultsListBlockProps) {

  return (
    <div className={fr.cx("fr-mb-8w")}>
      <div className={fr.cx("fr-mb-1w")}>
        <span className={fr.cx("fr-h5")}>
          {nbData > 1 ? blockTitlesPlural[type] : type}
        </span>{" "}
        <ResultNumber className={fr.cx("fr-h5")}>
          {nbData}
        </ResultNumber>
      </div>
      {dataList.map((data, index) => {
        if((isAllList && index < 4) || !isAllList) {
          return (
            <Fragment key={index}>
              {type === DataTypeEnum.MEDGROUP 
              ? (
                <DataBlockAccordion 
                  item={data.result as AdvancedMedicamentGroup}
                  filterPregnancy={filterPregnancy}
                  filterPediatric={filterPediatric}
                />
              ) : (
                <DataBlockGeneric 
                  item={{
                    result: data.result,
                    type: type
                  }}
                />
              )}
            </Fragment>
          )
        }
      })}
      {(isAllList && nbData > 4) && (
        <TagContainer>
          <Tag
            nativeButtonProps={{
              onClick: () => setFilterCategory(type)
            }}
          >
            <span>Voir tout&nbsp;({nbData})</span>
          </Tag>
        </TagContainer>
      )}
    </div>
  );
};

export default ResultsListBlock;
