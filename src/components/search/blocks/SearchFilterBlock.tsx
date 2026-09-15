"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import { SearchFilter } from "@/types/SearchTypes";
import SearchFilterBlockContent from "./SearchFilterBlockContent";
import Accordion from "@codegouvfr/react-dsfr/Accordion";

const ShowMoreLink = styled.div`
  margin-bottom: 1rem;
  .fr-link {
    cursor: pointer;
    background-image: var(--underline-img), var(--underline-img);
    background-position: var(--underline-x) 100%, var(--underline-x) calc(100% - var(--underline-thickness));
    background-repeat: no-repeat, no-repeat;
    transition: background-size 0s;
    background-size: var(--underline-hover-width) calc(var(--underline-thickness) * 2), var(--underline-idle-width) var(--underline-thickness);
  }
  .fr-link:hover {
    --underline-hover-width: var(--underline-max-width);
    background-color: var(--hover-tint);
  }
  .fr-link.active span{
    background: rgb(0 0 0 / 8%);
  }
`;

const SearchFilterDesktopContainer = styled.div`
  border-bottom: 2px solid var(--border-open-blue-france);
`;

interface SearchFilterBlockProps extends HTMLAttributes<HTMLDivElement> {
  filtersList: SearchFilter[];
  title: string;
  onClickFilter: (filter: SearchFilter, checked: boolean) => void;
  onClickChildFilter?: (filter: SearchFilter, childrenFilter: SearchFilter, checked: boolean) => void;
}

function SearchFilterBlock({
  filtersList,
  title,
  onClickFilter,
  onClickChildFilter,
}: SearchFilterBlockProps) {

  const isFiltersOpenStorageKey = `searchFilterBlock:${title}:isOpen`;

  const [isFullList, setIsFullList] = useState<boolean>(false);
  const [filteredFiltersList, setFilteredFiltersList] = useState<SearchFilter[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(isFiltersOpenStorageKey) === "true";
  });

  const onFiltersOpenChange = (expanded: boolean) => {
    setIsFiltersOpen(expanded);
    window.sessionStorage.setItem(isFiltersOpenStorageKey, String(expanded));
  };

  useEffect(() => {
    const newList = filtersList
      .map((filter: SearchFilter) => {
        if(filter.children) {
          if(filter.children) {
            filter.children
              .sort((a: SearchFilter, b: SearchFilter) => { 
                if(a.count === b.count) return a.name.localeCompare(b.name);
                return b.count - a.count;
              })
              .sort((a: SearchFilter, b: SearchFilter) => Number(b.selected) - Number(a.selected));
          }
        }
        return filter;
      })
      .sort((a: SearchFilter, b: SearchFilter) => { 
        if(a.count === b.count) return a.name.localeCompare(b.name);
        return b.count - a.count;
      })
      .sort((a: SearchFilter, b: SearchFilter) => Number(b.selected) - Number(a.selected));
    setFilteredFiltersList(newList);
  }, [filtersList, setFilteredFiltersList]);

  const getSelectedFiltersCount = (): number => {
    return filteredFiltersList.filter((filter) => filter.selected).length;
  }

  return filteredFiltersList.length > 0 && (
    <div>
      <Accordion 
        label={
          <>
            {title}
            {getSelectedFiltersCount() > 0 && (<span>&nbsp;{`(${getSelectedFiltersCount()})`}</span>)}
          </>
        }
        onExpandedChange={onFiltersOpenChange}
        expanded={isFiltersOpen}
        className={fr.cx("fr-hidden-md")}
      >
        <SearchFilterBlockContent
          filtersList={filtersList}
          isFullList={true}
          onClickFilter={onClickFilter}
          onClickChildFilter={onClickChildFilter}
        />
      </Accordion>
      <SearchFilterDesktopContainer className={fr.cx("fr-hidden", "fr-unhidden-md", "fr-mb-2w")}>
        <h3 className={fr.cx("fr-text--md")}>{title}</h3>
        <SearchFilterBlockContent
          filtersList={filtersList}
          isFullList={isFullList}
          onClickFilter={onClickFilter}
          onClickChildFilter={onClickChildFilter}
          small
        />
        {filtersList.length > 5 && (
          <ShowMoreLink>
            <span
              className={fr.cx("fr-link", "fr-text--sm")}
              onClick={() => setIsFullList(!isFullList)}
            >
              {isFullList ? "Voir moins" : "Voir plus"}
            </span>
          </ShowMoreLink>
        )}
      </SearchFilterDesktopContainer>
    </div>
  )
};
export default SearchFilterBlock;
