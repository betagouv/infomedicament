"use client";

import { HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { 
  ExtendedSearchResults, 
  SearchTypeEnum,
} from "@/types/SearchType";
import styled from 'styled-components';
import ResultsListBlock from "./ResultsListBlock";

const Container = styled.div `
  button.fr-tag[aria-pressed=true]:not(:disabled){
    background-color: var(--background-action-low-blue-france-active);
    color: var(--text-action-high-blue-france);
    background-image: none;
  }
  button.fr-tag[aria-pressed=true]::after{
    display: none;
  }
  .display-inline {
    display: inline;
  }
`;

const SearchTitle = styled.h1 `
  font-weight: normal !important;
  display: inline;
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: ExtendedSearchResults;
  totalResults: number;
  searchTerms: string;
}

function SearchResultsList({
  resultsList,
  totalResults,
  searchTerms,
}: SearchResultsListProps) {

  const [currentFilter, setCurrentFilter] = useState<SearchTypeEnum | boolean>(false);

  return (
    <Container>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-2w")}>
          <SearchTitle className={fr.cx("fr-h5", "fr-mb-0", "fr-mr-2w")}>
            {totalResults} résultats pour :
          </SearchTitle>
          <i className={fr.cx("fr-h5")}>“{searchTerms}“</i>
        </div>
      </div>
      {totalResults > 0 && (
        <div className={fr.cx("fr-grid-row", "fr-mb-5w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            <span className={["display-inline", fr.cx("fr-mr-2w")].join(" ")}>Filtrer</span>
            <ul className={["display-inline", fr.cx("fr-tags-group", "fr-mb-3w")].join(" ")}>
              <Tag
                pressed={!currentFilter}
                nativeButtonProps={{
                  onClick: () => setCurrentFilter(false)
                }}
                className="search-filter-tag"
              >
                Tout&nbsp;({totalResults})
              </Tag>
              {Object.keys(resultsList).map((key) => {
                const type = key as SearchTypeEnum;
                if(resultsList[type].length > 0) {
                  return (
                    <Tag
                      key={type}
                      pressed={currentFilter === type}
                      nativeButtonProps={{
                        onClick: () => setCurrentFilter(type)
                      }}
                      className="search-filter-tag"
                    >
                      {type}{" "}({resultsList[type].length})
                    </Tag>
                  )
                }
                })}
            </ul>
          </div>
        </div>
      )}
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          {Object.keys(resultsList).map((key) => {
            const type = key as SearchTypeEnum;
            if(resultsList[type].length > 0 && (!currentFilter || currentFilter === type)) {
              return (
                <ResultsListBlock
                  key={type}
                  dataList={resultsList[type]}
                  type={type}
                />
              )
            }
          })}
        </div>
      </div>
    </Container>
  );
};

export default SearchResultsList;
