"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import SearchFilterLabel from "./SearchFilterLabel";
import { SearchFilter } from "@/types/SearchTypes";

const SearchFilterContainer = styled.div`
  border-bottom: 2px solid var(--border-open-blue-france);
`;
const FilterListContainer = styled.div`
  margin-top: 1rem;
  .search-filter-cb-container:last-child {
    .fr-fieldset.search-filter-cb-child:last-child {
      margin-bottom: 0px;
    }
    margin-bottom: 1rem;
  } 
`;
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

  const [fullList, setFullList] = useState<boolean>(false);
  const [filteredFiltersList, setFilteredFiltersList] = useState<SearchFilter[]>([]);

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

  return filteredFiltersList.length > 0 && (
    <SearchFilterContainer className={fr.cx("fr-mb-2w")}>
      <h3 className={fr.cx("fr-text--md")}>{title}</h3>
      <FilterListContainer>
        {filteredFiltersList.map((filter: SearchFilter, index: number) => {
          if(filter.selected || (!fullList && index < 5) || fullList) {
            return (
              <div key={index} className="search-filter-cb-container">
                <Checkbox
                  key={index}
                  options={[{
                    label: (
                      <SearchFilterLabel
                        name={filter.name}
                        count={filter.count}
                      />
                    ),
                    nativeInputProps: {
                      checked: filter.selected,
                      onChange: (e) => onClickFilter(filter, (e.target as any).checked),
                    },
                  }]}
                  small
                />
                {(filter.children && filter.children.length > 0) && (
                  <Checkbox
                    className={["search-filter-cb-child", fr.cx("fr-ml-2w")].join(" ")}
                    options={filter.children.map((childrenFilter: SearchFilter, i: number) => 
                      ({
                        key: `${index}-${i}`,
                        label: (
                          <SearchFilterLabel
                            name={childrenFilter.name}
                            count={childrenFilter.count}
                          />
                        ),
                        nativeInputProps: {
                          checked: childrenFilter.selected,
                          onChange: (e) => onClickChildFilter && onClickChildFilter(filter, childrenFilter, (e.target as any).checked),
                        },
                      })
                    )}
                    small
                  />
                )}
              </div>
            )
          }
        })}
        {filtersList.length > 5 && (
          <ShowMoreLink>
            <span
              className={fr.cx("fr-link", "fr-text--sm")}
              onClick={() => setFullList(!fullList)}
            >
              {fullList ? "Voir moins" : "Voir plus"}
            </span>
          </ShowMoreLink>
        )}
      </FilterListContainer>
    </SearchFilterContainer>
  )
};
export default SearchFilterBlock;
