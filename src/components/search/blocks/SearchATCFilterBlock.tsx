"use client";

import { HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Link from "next/link";
import { ATCSearchFilter, SearchFilter } from "@/types/SpecialiteTypes";
import SearchFilterLabel from "./SearchFilterLabel";

const FilterTitle = styled.div`
  background-color: var(--background-default-grey);
  padding: 0.5rem;
  border: var(--border-action-high-grey) 2px solid;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--text-label-grey);
`;

interface SearchATCFilterBlockProps extends HTMLAttributes<HTMLDivElement> {
  filtersList: ATCSearchFilter[];
  title: string;
  onChangeATCFilter: (filter: ATCSearchFilter, checked: boolean) => void;
  isATC1Checked: (atcId: string) => boolean;
  onChangeATC2Filter: (atcFilter: ATCSearchFilter, atc2Filter: SearchFilter, checked: boolean) => void;
  isATC2Checked: (atcId: string, atc2Id: string) => boolean;
}

function SearchATCFilterBlock({
  filtersList,
  title,
  onChangeATCFilter,
  isATC1Checked,
  onChangeATC2Filter,
  isATC2Checked,
}: SearchATCFilterBlockProps) {

  const [fullList, setFullList] = useState<boolean>(false);

  const onViewFullList = () => {
    setFullList(!fullList);
  };

  return filtersList.length > 0 && (
    <div className={fr.cx("fr-mb-2w")}>
      <FilterTitle>{title}</FilterTitle>
      {filtersList.map((filter: ATCSearchFilter, index: number) => {
        if((!fullList && index < 5) || fullList) {
          return (
            <div key={index}>
              <Checkbox
                options={[{
                  label: (
                    <SearchFilterLabel
                      name={filter.name}
                      count={filter.count}
                    />
                  ),
                  nativeInputProps: {
                    checked: isATC1Checked(filter.id),
                    onChange: (e) => onChangeATCFilter(filter, (e.target as any).checked),
                  },
                }]}
                small
              />
              {(filter.children.length > 0) && (
                <Checkbox
                  className={fr.cx("fr-ml-2w")}
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
                        checked: isATC2Checked(filter.id, childrenFilter.id),
                        onChange: (e) => onChangeATC2Filter(filter, childrenFilter, (e.target as any).checked),
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
        <span
          className={fullList ? fr.cx("fr-icon-arrow-up-s-line") : fr.cx("fr-icon-arrow-down-s-line")}
        >
          <Link 
            className={fr.cx("fr-link", "fr-text--sm")}
            href=""
            onClick={() => onViewFullList()}
          >
            {fullList ? "Voir moins" : "Voir plus"}
          </Link>
        </span>
      )}
    </div>
  )
};

export default SearchATCFilterBlock;
