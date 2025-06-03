"use client";

import { Fragment, HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import styled from 'styled-components';
import { 
  SearchTypeEnum,
  SearchResultData,
} from "@/types/SearchTypes";
import GenericResultBlock from "./GenericResultBlock";
import AccordionResultBlock from "./AccordionResultBlock";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";

const TagContainer = styled.div `
  text-align: center;
`;
const ResultNumber = styled.span`
  font-weight: normal !important;
`;

interface ResultsListBlockProps extends HTMLAttributes<HTMLDivElement> {
  dataList: SearchResultData[];
  type: SearchTypeEnum;
  filterPregnancy: boolean;
  filterPediatric: boolean;
  isAllList: boolean;
  setFilterCategory: (filterCategory: SearchTypeEnum | boolean) => void;
}

const blockTitlesPlural = {
  [SearchTypeEnum.MEDGROUP]: "Médicaments",
  [SearchTypeEnum.SUBSTANCE]: "Substances actives",
  [SearchTypeEnum.ATCCLASS]: "Classes et sous-classes",
  [SearchTypeEnum.PATHOLOGY]: "Pathologies",
}

function ResultsListBlock({
  dataList,
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
          {dataList.length > 1 ? blockTitlesPlural[type] : type}
        </span>{" "}
        <ResultNumber className={fr.cx("fr-h5")}>{dataList.length}</ResultNumber>
      </div>
      {dataList.map((data, index) => {
        if((isAllList && index < 4) || !isAllList) {
          return (
            <Fragment key={index}>
              {type === SearchTypeEnum.MEDGROUP 
              ? (
                <AccordionResultBlock 
                  item={data as AdvancedMedicamentGroup}
                  filterPregnancy={filterPregnancy}
                  filterPediatric={filterPediatric}
                />
              ) : (
                <GenericResultBlock 
                  type={type} 
                  item={data} 
                />
              )}
            </Fragment>
          )
        }
      })}
      {(isAllList && dataList.length > 4) && (
        <TagContainer>
          <Tag
            nativeButtonProps={{
              onClick: () => setFilterCategory(type)
            }}
          >
            <span>Voir tout&nbsp;({dataList.length})</span>
          </Tag>
        </TagContainer>
      )}
    </div>
  );
};

export default ResultsListBlock;
