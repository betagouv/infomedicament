"use client";

import { Fragment, HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";
import { 
  ExtendedSearchResultItem, 
  mainFiltersList, 
  MainFilterType, 
  MainFilterTypeEnum,
  SearchATCClass,
  SearchMedicamentGroup, 
} from "@/types/SearchType";
import ATCClassResult from "./ATCClassResult";
import SubstanceResult from "./SubstanceResult";
import PathoResult from "./PathoResult";
import MedGroupSpecListResult from "./MedGroupSpecListResult";
import styled from 'styled-components';

const SearchTerm = styled.div `
  font-weight: normal !important;
  font-style: italic;
`;

type MainFilterCounterType = { [key in MainFilterTypeEnum]: number } ;
const emptyMainFilterCounter: MainFilterCounterType = {
  [MainFilterTypeEnum.EMPTY]: 0,
  [MainFilterTypeEnum.MEDGROUP]: 0,
  [MainFilterTypeEnum.SUBSTANCE]: 0,
  [MainFilterTypeEnum.PATHOLOGY]: 0,
  [MainFilterTypeEnum.ATCCLASS]: 0,
}

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: ExtendedSearchResultItem[];
  searchTerms: string;
}

function SearchResultsList({
  resultsList,
  searchTerms,
}: SearchResultsListProps) {

  const [currentFilter, setCurrentFilter] = useState<MainFilterTypeEnum>(MainFilterTypeEnum.EMPTY);
  const [mainFilterCounter, setMainFilterCounter] = useState<MainFilterCounterType>(emptyMainFilterCounter);

  //Calcul counter;
  useEffect(() => {
    const initMailFilterCounter = emptyMainFilterCounter;
    resultsList.map((result: ExtendedSearchResultItem) => {
      if(result.filterType === MainFilterTypeEnum.SUBSTANCE) {
        initMailFilterCounter[MainFilterTypeEnum.SUBSTANCE] ++;
      } else if(result.filterType === MainFilterTypeEnum.MEDGROUP) {
        initMailFilterCounter[MainFilterTypeEnum.MEDGROUP] ++;
      } else if (result.filterType === MainFilterTypeEnum.PATHOLOGY) {
        initMailFilterCounter[MainFilterTypeEnum.PATHOLOGY] ++;
      } else {
        initMailFilterCounter[MainFilterTypeEnum.ATCCLASS] ++;
      }
      initMailFilterCounter[MainFilterTypeEnum.EMPTY] ++;
    });
    setMainFilterCounter(initMailFilterCounter);
  }, []);


  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-2w")}>
          <h1 className={fr.cx("fr-h5", "fr-mb-0")}>
            {resultsList.length} résultats pour :<br/>
          </h1>
          <SearchTerm className={fr.cx("fr-h5")}>{searchTerms}</SearchTerm>
        </div>
      </div>
      <div>
        <div
          className="container"
          style={{
            width: 800
          }}
        >
          <ul className={fr.cx("fr-tags-group", "fr-mb-3w")}>
            {mainFiltersList.map((filter: MainFilterType, index) => {
              const counter: number = mainFilterCounter[filter.type];
              if(counter > 0) {
                return (
                  <Tag
                    key={index}
                    pressed={currentFilter === filter.type}
                    nativeButtonProps={{
                      onClick: () => setCurrentFilter(filter.type)
                    }}
                  >
                    {filter.text}{" "}({counter})
                  </Tag>
                )
              }
            })}
          </ul>
        </div>
      </div>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <ul className={fr.cx("fr-raw-list")}>
            {resultsList.map((result, index) => (
              <Fragment key={index}>
                {result.filterType === MainFilterTypeEnum.SUBSTANCE ? (
                  (currentFilter === MainFilterTypeEnum.EMPTY || currentFilter === MainFilterTypeEnum.SUBSTANCE) && (
                    <SubstanceResult item={result.data as SubstanceNom} />
                  )
                ) : result.filterType === MainFilterTypeEnum.MEDGROUP ? (
                  (currentFilter === MainFilterTypeEnum.EMPTY || currentFilter === MainFilterTypeEnum.MEDGROUP) && (
                    <MedGroupSpecListResult
                    item={result.data as SearchMedicamentGroup}
                  />
                  )
                ) : result.filterType === MainFilterTypeEnum.PATHOLOGY ? (
                  (currentFilter === MainFilterTypeEnum.EMPTY || currentFilter === MainFilterTypeEnum.PATHOLOGY) && (
                    <PathoResult item={result.data as Patho} />
                  )
                ) : (
                  (currentFilter === MainFilterTypeEnum.EMPTY || currentFilter === MainFilterTypeEnum.ATCCLASS) && (
                    <ATCClassResult item={result.data as SearchATCClass} />
                  )
                )}
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default SearchResultsList;
