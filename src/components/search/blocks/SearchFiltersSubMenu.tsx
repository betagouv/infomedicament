"use client";

import { HTMLAttributes, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";
import { SearchFilter, SortType } from "@/types/SearchTypes";
import SearchFiltersContainer from "./SearchFiltersContainer";

const SubMenuContainer = styled.div<{ 
  $isOpen: boolean;
}>`
  .fr-accordion__btn {
    color: var(--text-title-grey);
    background: none;
    font-weight: 700;
    padding: 1rem;
  }
  .fr-accordion:before {
    box-shadow: inset 0 0px,0 1px 0 0 var(--border-default-grey);
  }
  .fr-accordion .fr-collapse--expanded {
    padding-top: 0px;
    padding-bottom: 0px;
    margin-top: 0.5rem;
  }
  .fr-accordion .fr-fieldset {
    margin: 0 0rem 1rem;
  }
  .fr-accordion__btn:after {
    width: 20px;
    height: 20px;
    background-color: var(--text-action-high-blue-france);
  }

  ${props => props.$isOpen && css`
    overflow: auto;
    position: fixed;
    background-color: white;
    width: 100%;
    height: 100%;
    margin-left: -1rem;
    top: 0px;
    opacity: 1;
    z-index: 10000;
  `}
`;
const SubMenuOpenButton = styled.div<{ 
  $isOpen: boolean;
}>`
  button {
    width: 100%;
    background-color: var(--background-alt-blue-france);
    color: var(--text-title-grey);
    display: block;
    border-radius: 4px;
  }
  ${props => props.$isOpen 
    ? css`
      button {
        border: none;
        padding-top: 1rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-open-blue-france);
        text-align: left;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .fr-icon-close-line {
          color: var(--text-action-high-blue-france);
        }
      }` 
    : css`
      button {
        text-align: center;
        border: 2px solid var(--border-open-blue-france);
        text-transform: uppercase;
      }
    `
  }
`;

interface SearchFiltersSubMenuProps extends HTMLAttributes<HTMLDivElement> {
  allSubsFilters: SearchFilter[];
  allAtcFilters: SearchFilter[];
  allIndicationsFilters: SearchFilter[];
  setAllAtcFilters: (filters: SearchFilter[]) => void;
  setAllSubsFilters: (filters: SearchFilter[]) => void;
  setAllIndicationsFilters: (filters: SearchFilter[]) => void;
  setSortType: (sortType: SortType) => void;
  setIsSortAsc: (isSortAsc: boolean) => void;
  selectedFiltersCount: number;
}

function SearchFiltersSubMenu({
  allSubsFilters,
  allAtcFilters,
  allIndicationsFilters,
  setAllSubsFilters,
  setAllAtcFilters,
  setAllIndicationsFilters,
  setSortType,
  setIsSortAsc,
  selectedFiltersCount,
}: SearchFiltersSubMenuProps) {

  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  return (
    <SubMenuContainer $isOpen={isFiltersOpen}>
      <SubMenuOpenButton $isOpen={isFiltersOpen}>
        <Button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          priority="tertiary no outline"
        >
          <span>
            <span className={["fr-icon--custom-filters", fr.cx("fr-mr-1w")].join(" ")}/>
            Filtres
            {selectedFiltersCount > 0 && (
              <span>{" "}({selectedFiltersCount})</span>
            )}
          </span>
          {isFiltersOpen && (
            <span 
              className={fr.cx("fr-icon-close-line", "fr-mr-1w")}
            />
          )}
        </Button>
      </SubMenuOpenButton>
      {isFiltersOpen && (
        <SearchFiltersContainer
          allSubsFilters={allSubsFilters}
          allAtcFilters={allAtcFilters}
          allIndicationsFilters={allIndicationsFilters}
          setAllSubsFilters={setAllSubsFilters}
          setAllAtcFilters={setAllAtcFilters}
          setAllIndicationsFilters={setAllIndicationsFilters}
          setSortType={setSortType}
          setIsSortAsc={setIsSortAsc}
        />
      )}
    </SubMenuContainer>
  );
};

export default SearchFiltersSubMenu;
