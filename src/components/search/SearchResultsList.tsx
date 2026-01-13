"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { ExtendedSearchResults } from "@/types/SearchTypes";
import styled from 'styled-components';
import ResultsListBlock from "./ResultsListBlock";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesSearchList from "../articles/ArticlesSearchList";
import PregnancyPediatricFilters from "./PregnancyPediatricFilters";

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
  display: inline;
  span {
    font-weight: normal !important;
  }
  i {
    font-weight: bold;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: scroll;
`;

const ResultsListBlockContainer = styled.div`
  column-gap: 2rem;
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: ExtendedSearchResults;
  totalResults: number;
  searchTerms?: string | boolean;
  articles?: false | "" | ArticleCardResume[] | undefined;
  setFilterPregnancy: (value:boolean) => void;
  setFilterPediatric: (value:boolean) => void;
  filterPregnancy: boolean;
  filterPediatric: boolean;
}

function SearchResultsList({
  resultsList,
  totalResults,
  searchTerms,
  articles,
  setFilterPregnancy,
  setFilterPediatric,
  filterPregnancy,
  filterPediatric,
}: SearchResultsListProps) {

  const [filterCategory, setFilterCategory] = useState<DataTypeEnum | boolean>(false);
  const [nbResults, setNbResults] = useState<number>(0);
  const [nbResultsATC, setNbResultsATC] = useState<number>(0);

  useEffect(() => {
    let totalATC: number = resultsList[DataTypeEnum.ATCCLASS].length;
    resultsList[DataTypeEnum.ATCCLASS].forEach((data) => {
      totalATC += (data.result as AdvancedATCClass).subclasses.length;
    });
    setNbResultsATC(totalATC);
    setNbResults(totalResults + totalATC);
  }, [totalResults, resultsList, setNbResultsATC, setNbResults]);

  return (
    <Container>
      <div className={fr.cx("fr-grid-row", "fr-mb-2w")}>
        <PregnancyPediatricFilters 
          setFilterPregnancy={setFilterPregnancy}
          setFilterPediatric={setFilterPediatric}
          filterPregnancy={filterPregnancy}
          filterPediatric={filterPediatric}
        />
      </div>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-2w")}>
          <SearchTitle className={fr.cx("fr-text--md")}>
            <span className={fr.cx("fr-mr-2w")}>
              {nbResults} résultats pour :
            </span>
            <i>“{searchTerms}“</i>
          </SearchTitle>
        </div>
      </div>
      {nbResults > 0 && (
        <div className={fr.cx("fr-grid-row", "fr-mb-5w")}>
          <FiltersContainer className={fr.cx("fr-col-12")}>
            <span className={["display-inline", fr.cx("fr-mr-2w", "fr-text--md", "fr-mb-1w")].join(" ")}>Filtrer</span>
            <ul className={["display-inline", fr.cx("fr-tags-group")].join(" ")}>
              <Tag
                pressed={!filterCategory}
                nativeButtonProps={{
                  onClick: () => setFilterCategory(false)
                }}
                className="search-filter-tag"
              >
                Tout&nbsp;({nbResults})
              </Tag>
              {Object.keys(resultsList).map((key) => {
                const type = key as DataTypeEnum;
                  return (
                    <Tag
                      key={type}
                      pressed={filterCategory === type}
                      nativeButtonProps={{
                        onClick: () => setFilterCategory(type)
                      }}
                      className="search-filter-tag"
                    >
                      {type}{" "}({type !== DataTypeEnum.ATCCLASS ? resultsList[type].length : nbResultsATC})
                    </Tag>
                  )
                })}
            </ul>
          </FiltersContainer>
        </div>
      )}
      <ResultsListBlockContainer className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
          {Object.keys(resultsList).map((key) => {
            const type = key as DataTypeEnum;
            if(resultsList[type].length > 0 && (!filterCategory || filterCategory === type)) {
              return (
                <ResultsListBlock
                  key={type}
                  dataList={resultsList[type]}
                  nbData={type !== DataTypeEnum.ATCCLASS ? resultsList[type].length : nbResultsATC}
                  type={type}
                  filterPregnancy={filterPregnancy}
                  filterPediatric={filterPediatric}
                  isAllList={!filterCategory}
                  setFilterCategory={setFilterCategory}
                />
              )
            }
          })}
        </div>
        {(articles && articles.length > 0) && (
          <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
            <ArticlesSearchList 
              articles={articles} 
              trackingFrom="Recherche"
            />
          </div>
        )}
      </ResultsListBlockContainer>
    </Container>
  );
};

export default SearchResultsList;
