"use client";

import { HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Link from "next/link";
import { SearchFilter } from "@/types/SpecialiteTypes";
import SearchFilterLabel from "./SearchFilterLabel";

const FilterTitle = styled.div`
  background-color: var(--background-default-grey);
  padding: 0.5rem;
  border: var(--border-action-high-grey) 2px solid;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--text-label-grey);
`;

interface SearchFilterBlockProps extends HTMLAttributes<HTMLDivElement> {
  filtersList: SearchFilter[];
  title: string;
  onClickFilter: (filter: SearchFilter, checked: boolean) => void;
}

function SearchFilterBlock({
  filtersList,
  title,
  onClickFilter,
}: SearchFilterBlockProps) {

  const [fullList, setFullList] = useState<boolean>(false);

  const onViewFullList = () => {
    setFullList(!fullList);
  };

  return filtersList.length > 0 && (
    <div className={fr.cx("fr-mb-2w")}>
      <FilterTitle>{title}</FilterTitle>
      {filtersList.map((filter: SearchFilter, index: number) => {
        if((!fullList && index < 5) || fullList) {
          return (<Checkbox
            key={index}
            options={[{
              label: (
                <SearchFilterLabel
                  name={filter.name}
                  count={filter.count}
                />
              ),
              nativeInputProps: {
                defaultChecked: false,
                onClick: (e) => onClickFilter(filter, (e.target as any).checked),
              },
            }]}
            small
          />)
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
export default SearchFilterBlock;
