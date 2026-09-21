"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import SearchFilterLabel from "./SearchFilterLabel";
import { SearchFilter } from "@/types/SearchTypes";

const FilterListContainer = styled.div`
  .search-filter-cb-container:last-child {
    .fr-fieldset.search-filter-cb-child:last-child {
      margin-bottom: 0px;
    }
    margin-bottom: 1rem;
  } 
  @media (min-width: 48em) {
    margin-top: 1rem;
  }
`;

interface SearchFilterBlockContentProps extends HTMLAttributes<HTMLDivElement> {
  filtersList: SearchFilter[];
  isFullList: boolean;
  small?: boolean;
  onClickFilter: (filter: SearchFilter, checked: boolean) => void;
  onClickChildFilter?: (filter: SearchFilter, childrenFilter: SearchFilter, checked: boolean) => void;
}

function SearchFilterBlockContent({
  filtersList,
  isFullList,
  small,
  onClickFilter,
  onClickChildFilter,
}: SearchFilterBlockContentProps) {

  return (
    <FilterListContainer>
      {filtersList.map((filter: SearchFilter, index: number) => {
        if(filter.selected || (!isFullList && index < 5) || isFullList) {
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
                small={small ? true : false}
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
                  small={small ? true : false}
                />
              )}
            </div>
          )
        }
      })}
    </FilterListContainer>
  )
};
export default SearchFilterBlockContent;
