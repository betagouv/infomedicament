"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Link from "next/link";
import { SearchFilter } from "@/types/SearchTypes";
import SearchFilterBlock from "./SearchFilterBlock";
import SearchFiltersTitle from "./SearchFiltersTitle";

const FiltersContainer = styled.div`
  display: flex;
  flex-direction: column;
  .fr-fieldset__content .fr-checkbox-group label {
    font-size: 0.875rem !important;
    padding-bottom: 0px;
  }
  @media (min-width: 48em) {
    padding: 1rem 2rem 1rem 0rem;
    flex: 0 0 260px !important;
    width: 260px !important;
    max-width: 260px !important;
  }
  @media (max-width: 48em) {
    padding: 1rem 0rem 1rem 0rem;
  }
`;
const UnselectFiltersContainer = styled.div`
  border-bottom: 2px solid var(--border-open-blue-france);
  margin-bottom: 1rem;
`;
interface SearchFiltersContainerProps extends HTMLAttributes<HTMLDivElement> {
  allSubsFilters: SearchFilter[];
  allAtcFilters: SearchFilter[];
  allIndicationsFilters: SearchFilter[];
  setAllAtcFilters: (filters: SearchFilter[]) => void;
  setAllSubsFilters: (filters: SearchFilter[]) => void;
  setAllIndicationsFilters: (filters: SearchFilter[]) => void;
}

function SearchFiltersContainer({
  allSubsFilters,
  allAtcFilters,
  allIndicationsFilters,
  setAllSubsFilters,
  setAllAtcFilters,
  setAllIndicationsFilters,
  ...props
}: SearchFiltersContainerProps) {

  const onChangeSubsFilter = (filter: SearchFilter, checked: boolean) => {
    const subsIndex = allSubsFilters.findIndex((subsFilter) => filter.id === subsFilter.id);
    if(subsIndex !== -1) {
      const updatedSubsFilters = [...allSubsFilters];
      updatedSubsFilters[subsIndex].selected = checked;
      setAllSubsFilters(updatedSubsFilters);
    }
  };
  
  const onChangeATCFilter = (filter: SearchFilter, checked: boolean) => {
    const atcIndex = allAtcFilters.findIndex((atcFilter) => filter.id === atcFilter.id);
    if(atcIndex !== -1) {
      const updatedAtcFilters = allAtcFilters.map((filter) => ({
        ...filter,
        children: filter.children && filter.children.map((childFilter) => ({...childFilter}))
      }));
      updatedAtcFilters[atcIndex].selected = checked;
      updatedAtcFilters[atcIndex].children && updatedAtcFilters[atcIndex].children.forEach((childFilter) => {
        childFilter.selected = checked;
      });
      setAllAtcFilters(updatedAtcFilters);
    }
  };

  const onChangeATC2Filter = (atcFilter: SearchFilter, atc2Filter: SearchFilter, checked: boolean) => {
    //Update atc list
    const atcIndex = allAtcFilters.findIndex((filter) => atcFilter.id === filter.id);
    if(atcIndex !== -1) {
      const updatedAtcFilters = allAtcFilters.map((filter) => ({
        ...filter,
        children: filter.children && filter.children.map((childFilter) => ({...childFilter}))
      }));
      const atc2Index = updatedAtcFilters[atcIndex].children 
        ? updatedAtcFilters[atcIndex].children.findIndex((childrenFilter) => atc2Filter.id === childrenFilter.id) 
        : -1;
      if(atc2Index !== -1 && updatedAtcFilters[atcIndex].children) {
        updatedAtcFilters[atcIndex].children[atc2Index].selected = checked;
        if(checked) {
          //At least one ATC2 is selected - select the parent
          updatedAtcFilters[atcIndex].selected = true;
        } else {
          const selectedChildren = updatedAtcFilters[atcIndex].children.filter((childrenFilter) => childrenFilter.selected);
          //No ATC2 is selected - unselect the parent
          if(selectedChildren.length === 0) updatedAtcFilters[atcIndex].selected = false;
        }
        setAllAtcFilters(updatedAtcFilters);
      }
    }
  };

  const onChangeIndicationsFilter = (filter: SearchFilter, checked: boolean) => {
    const indicationIndex = allIndicationsFilters.findIndex(
      (indicationFilter) => filter.id === indicationFilter.id && filter.name === indicationFilter.name
    );
    if(indicationIndex !== -1) {
      const updatedIndicationsFilters = [...allIndicationsFilters];
      updatedIndicationsFilters[indicationIndex].selected = checked;
      setAllIndicationsFilters(updatedIndicationsFilters);
    }
  };

  const onUnselectAll = () => {
    //Substances
    const updatedSubsFilters = allSubsFilters.map((filter) => ({...filter, selected: false}));
    setAllSubsFilters(updatedSubsFilters);
    //ATC 1 & 2
    const updatedAtcFilters: SearchFilter[] = allAtcFilters.map((filter) => ({
      ...filter,
      selected: false,
      children: filter.children && filter.children.map((childFilter) => ({...childFilter, selected: false}))
    }));
    setAllAtcFilters(updatedAtcFilters);
    // //Indications
    const updatedIndicationsFilters = allIndicationsFilters.map((filter) => ({...filter, selected: false}));
    setAllIndicationsFilters(updatedIndicationsFilters);
  };

  return (
    <FiltersContainer {...props} className={[fr.cx("fr-col-12"), props.className].join(" ")}>
      <SearchFiltersTitle  
        className={fr.cx("fr-hidden", "fr-unhidden-md")}
      />
      <UnselectFiltersContainer>
        {(allSubsFilters.filter((filter) => filter.selected).length > 0 
          || allAtcFilters.filter((filter) => filter.selected).length > 0 
          || allIndicationsFilters.filter((filter) => filter.selected).length > 0) && (
          <div className={fr.cx("fr-mb-2w")}>
            <Link 
              className={fr.cx("fr-link", "fr-text--sm", "fr-mb-2w")}
              href=""
              onClick={onUnselectAll}
            >
              Effacer tous les filtres
            </Link>
          </div>
        )}
      </UnselectFiltersContainer>
      <SearchFilterBlock
        filtersList={allSubsFilters}
        title="Substance active"
        onClickFilter={onChangeSubsFilter}
      />
      <SearchFilterBlock
        filtersList={allAtcFilters}
        title="Classe de médicament"
        onClickFilter={onChangeATCFilter}
        onClickChildFilter={onChangeATC2Filter}
      />
      <SearchFilterBlock
        filtersList={allIndicationsFilters}
        title="Indication"
        onClickFilter={onChangeIndicationsFilter}
      />
    </FiltersContainer>
  );
};

export default SearchFiltersContainer;
