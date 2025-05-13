"use client";

import { Fragment, HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";

import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";
import { 
  ExtendedSearchResultItem, 
  MainFilterCounterType, 
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
import AccordionResultBlock from "./AccordionResultBlock";

const Container = styled.div `
  button.fr-tag[aria-pressed=true]:not(:disabled){
    background-color: var(--background-action-low-blue-france-active);
    color: var(--text-action-high-blue-france);
    background-image: none;
  }
  button.fr-tag[aria-pressed=true]::after{
    display: none;
  }
`;


const SearchTerm = styled.div `
  font-weight: normal !important;
  font-style: italic;
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: ExtendedSearchResultItem[];
  counters: MainFilterCounterType;
  searchTerms: string;
}

function SearchResultsList({
  resultsList,
  counters,
  searchTerms,
}: SearchResultsListProps) {

  const [currentFilter, setCurrentFilter] = useState<MainFilterTypeEnum>(MainFilterTypeEnum.ALL);

  return (
    <Container>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-2w")}>
          <h1 className={fr.cx("fr-h5", "fr-mb-0")}>
            {resultsList.length} résultats pour :<br/>
          </h1>
          <SearchTerm className={fr.cx("fr-h5")}>{searchTerms}</SearchTerm>
        </div>
      </div>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <ul className={fr.cx("fr-tags-group", "fr-mb-3w")}>
            {mainFiltersList.map((filter: MainFilterType, index) => {
              const counter: number = counters[filter.type];
              if(counter > 0) {
                return (
                  <Tag
                    key={index}
                    pressed={currentFilter === filter.type}
                    nativeButtonProps={{
                      onClick: () => setCurrentFilter(filter.type)
                    }}
                    className="search-filter-tag"
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
                  (currentFilter === MainFilterTypeEnum.ALL || currentFilter === MainFilterTypeEnum.SUBSTANCE) && (
                    <SubstanceResult item={result.data as SubstanceNom} />
                  )
                ) : result.filterType === MainFilterTypeEnum.MEDGROUP ? (
                  (currentFilter === MainFilterTypeEnum.ALL || currentFilter === MainFilterTypeEnum.MEDGROUP) && (
                    <AccordionResultBlock item={result.data as SearchMedicamentGroup} />
                  )
                ) : result.filterType === MainFilterTypeEnum.PATHOLOGY ? (
                  (currentFilter === MainFilterTypeEnum.ALL || currentFilter === MainFilterTypeEnum.PATHOLOGY) && (
                    <PathoResult item={result.data as Patho} />
                  )
                ) : (
                  (currentFilter === MainFilterTypeEnum.ALL || currentFilter === MainFilterTypeEnum.ATCCLASS) && (
                    <ATCClassResult item={result.data as SearchATCClass} />
                  )
                )}
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
};

export default SearchResultsList;
