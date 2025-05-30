"use client";

import { HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
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

  const [filterCategory, setFilterCategory] = useState<SearchTypeEnum | boolean>(false);
  const [filterPregnancy, setFilterPregnancy] = useState<boolean>(false);
  const [filterPediatric, setFilterPediatric] = useState<boolean>(false);

  return (
    <Container>
      <div className={fr.cx("fr-grid-row", "fr-mb-2w")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-1w")}>
          <Checkbox
            small
            options={[
              {
                label: 'Je suis enceinte ou prévoit de l\'être',
                nativeInputProps: {
                  checked: filterPregnancy,
                  onChange: () => setFilterPregnancy(!filterPregnancy),
                }
              },
              {
                label: 'Pour un enfant',
                nativeInputProps: {
                  checked: filterPediatric,
                  onChange: () => setFilterPediatric(!filterPediatric),
                }
              }
            ]}
            orientation="horizontal"
          />
        </div>
      </div>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-2w")}>
          <SearchTitle className={fr.cx("fr-text--md")}>
            <span className={fr.cx("fr-mr-2w")}>
              {totalResults} résultats pour :
            </span>
            <i>“{searchTerms}“</i>
          </SearchTitle>
        </div>
      </div>
      {totalResults > 0 && (
        <div className={fr.cx("fr-grid-row", "fr-mb-5w")}>
          <FiltersContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            <span className={["display-inline", fr.cx("fr-mr-2w", "fr-text--md", "fr-mb-1w")].join(" ")}>Filtrer</span>
            <ul className={["display-inline", fr.cx("fr-tags-group")].join(" ")}>
              <Tag
                pressed={!filterCategory}
                nativeButtonProps={{
                  onClick: () => setFilterCategory(false)
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
                      pressed={filterCategory === type}
                      nativeButtonProps={{
                        onClick: () => setFilterCategory(type)
                      }}
                      className="search-filter-tag"
                    >
                      {type}{" "}({resultsList[type].length})
                    </Tag>
                  )
                }
                })}
            </ul>
          </FiltersContainer>
        </div>
      )}
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          {Object.keys(resultsList).map((key) => {
            const type = key as SearchTypeEnum;
            if(resultsList[type].length > 0 && (!filterCategory || filterCategory === type)) {
              return (
                <ResultsListBlock
                  key={type}
                  dataList={resultsList[type]}
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
      </div>
    </Container>
  );
};

export default SearchResultsList;
