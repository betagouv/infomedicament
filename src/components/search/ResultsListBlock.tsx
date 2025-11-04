"use client";

import { Fragment, HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import styled from 'styled-components';
import DataBlockGeneric from "../data/DataBlockGeneric";
import DataBlockAccordion from "../data/DataBlockAccordion";
import { AdvancedATCClass, AdvancedData, DataTypeEnum } from "@/types/DataTypes";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { ResumeGeneric, ResumePatho, ResumeSubstance } from "@/db/types";

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
  [DataTypeEnum.EXPIRED]: "Médicaments non commercialisés",
  [DataTypeEnum.GENERIC]: "Médicaments génériques",
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
              {(type === DataTypeEnum.MEDGROUP || type === DataTypeEnum.EXPIRED)
              ? (
                <DataBlockAccordion 
                  item={data.result as ResumeSpecGroup}
                  filterPregnancy={filterPregnancy}
                  filterPediatric={filterPediatric}
                  withAlert
                />
              ) : (
                <DataBlockGeneric 
                  type={type}
                  item={data.result as ResumeSubstance | ResumePatho | AdvancedATCClass | ResumeGeneric}
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
