"use client";

import { Fragment, HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import styled from 'styled-components';
import { 
  SearchTypeEnum,
  SearchMedicamentGroup,
  SearchResultData,
} from "@/types/SearchType";
import GenericResultBlock from "./GenericResultBlock";
import AccordionResultBlock from "./AccordionResultBlock";

const TagContainer = styled.div `
  text-align: center;
`;

interface ResultsListBlockProps extends HTMLAttributes<HTMLDivElement> {
  dataList: SearchResultData[];
  type: SearchTypeEnum;
}

function ResultsListBlock({
  dataList,
  type
}: ResultsListBlockProps) {

  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className={fr.cx("fr-mb-3w")}>
      <div className={fr.cx("fr-mb-1w")}>
        <span className={fr.cx("fr-h5")}>{type}</span>{" "}{dataList.length}
      </div>
      {dataList.map((data, index) => {
        if((!isOpen && index < 4) || isOpen) {
          return (
            <Fragment key={index}>
              {type === SearchTypeEnum.MEDGROUP 
              ? (
                <AccordionResultBlock item={data as SearchMedicamentGroup} />
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
      {dataList.length > 4 && (
        <TagContainer>
          <Tag
            pressed={isOpen}
            nativeButtonProps={{
              onClick: () => setIsOpen(!isOpen)
            }}
          >
            {!isOpen ? (
              <span>Voir tout&nbsp;({dataList.length})</span>
            ) : (
              <span>Voir moins</span>
            )}
          </Tag>
        </TagContainer>
      )}
    </div>
  );
};

export default ResultsListBlock;
