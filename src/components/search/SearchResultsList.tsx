"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import DataBlockAccordion from "../data/DataBlockAccordion";
import { SearchResultItem } from "@/db/utils/search";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesSearchList from "../articles/ArticlesSearchList";
import PregnancyPediatricFilters from "./PregnancyPediatricFilters";

const Container = styled.div `
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

const ResultsListBlockContainer = styled.div`
  column-gap: 2rem;
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: SearchResultItem[];
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
              {totalResults} résultats pour :
            </span>
            <i>"{searchTerms}"</i>
          </SearchTitle>
        </div>
      </div>
      <ResultsListBlockContainer className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
          {resultsList.map((result, index) => (
            <DataBlockAccordion
              key={index}
              item={result}
              matchReasons={result.matchReasons}
              filterPregnancy={filterPregnancy}
              filterPediatric={filterPediatric}
              withAlert
            />
          ))}
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
