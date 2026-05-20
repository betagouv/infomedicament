"use client";

import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import DataBlockAccordion from "../data/DataBlockAccordion";
import { SearchResultItem } from "@/db/utils/search";
import Link from "next/link";
import Button from "@codegouvfr/react-dsfr/Button";
import SearchFilterBlock from "./blocks/SearchFilterBlock";
import { SearchFilter, SortType } from "@/types/SearchTypes";

const Container = styled.div `
  .display-inline {
    display: inline;
  }
`;
const FiltersContainer = styled.div`
  padding: 1rem 2rem;
  .fr-fieldset__content .fr-checkbox-group label {
    font-size: 0.875rem !important;
    padding-bottom: 0px;
  }
`;
const SortContainer = styled.div`
  text-align: right;
`;
const FiltersTitle = styled.h1`
  font-weight: normal;
`;
const FiltersContainerTitleBlock = styled.div`
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
  align-items: flex-start;
  border-bottom: 2px solid var(--border-open-blue-france);
  margin-bottom: 1rem;
`;
const FiltersContainerTitle = styled.h2`
  font-weight: normal !important;
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: SearchResultItem[];
  search?: string;
}

function SearchResultsList({
  resultsList,
  search,
}: SearchResultsListProps) {

  const [filteredResultsList, setFilteredResultsList] = useState<SearchResultItem[]>([]);

  const [allSubsFilters, setAllSubsFilters] = useState<SearchFilter[]>([]);
  const [currentSubsFilters, setCurrentSubsFilters] = useState<SearchFilter[]>([]);//property count is not used
  const [allAtcFilters, setAllAtcFilters] = useState<SearchFilter[]>([]);
  const [currentAtcFilters, setCurrentAtcFilters] = useState<SearchFilter[]>([]);//property count is not used
  const [allIndicationsFilters, setAllIndicationsFilters] = useState<SearchFilter[]>([]);
  const [currentIndicationsFilters, setCurrentIndicationsFilters] = useState<SearchFilter[]>([]);//property count is not used

  const [currentSortType, setCurrentSortType] = useState<SortType>("score");
  const [isSortAsc, setIsSortAsc] = useState<boolean>(true);

  const onSortFilters = useCallback((
    newSubsFilters: SearchFilter[],
  ): SearchFilter[] => {
    if(newSubsFilters.length > 0 && newSubsFilters[0].children) {
      newSubsFilters.forEach((filter) => {
        if(filter.children) {
          filter.children.sort((a,b) => { 
            if(a.count === b.count) return a.name.localeCompare(b.name);
            return b.count - a.count;
          });
        }
      })
    }
    return newSubsFilters.sort((a: SearchFilter, b: SearchFilter) => { 
      if(a.count === b.count) return a.name.localeCompare(b.name);
      return b.count - a.count;
    });
  },[]);

  //Loaded
  useEffect(() => {
    const newSubsFilters: SearchFilter[] = [];
    const newATCFilters: SearchFilter[] = [];
    const newIndicationsFilters: SearchFilter[] = [];
    resultsList.forEach((result) => {
      if(result.composants) {
        const indexSubs = newSubsFilters.findIndex((filter: SearchFilter) => result.composants.trim() === filter.id);
        if(indexSubs === -1) {
          newSubsFilters.push({
            id: result.composants.trim(),
            name: result.composants.trim(), 
            count: 1,
            selected: false,
          });
        } else {
          newSubsFilters[indexSubs].count += 1;
        }
      }
      //ATC 1 & 2 List
      const indexATC = newATCFilters.findIndex((filter: SearchFilter) => result.atc1Code && result.atc1Code.trim() === filter.id);
      if(indexATC === -1) {
        if(result.atc1Label && result.atc1Code){
          //New ATC in the list
          newATCFilters.push({
            id: result.atc1Code.trim(),
            name: result.atc1Label.trim(),
            count: 1,
            selected: false,
            children: (result.atc2Code && result.atc2Label) ? [{
              id: result.atc2Code.trim(),
              name: result.atc2Label.trim(),
              count: 1,
              selected: false,
            }] : [],
          });
        }
      } else {
        if(result.atc2Label && result.atc2Code && newATCFilters[indexATC].children) {
          //ATC 1 exists, test for ATC2
          const indexATC2 = newATCFilters[indexATC].children.findIndex((filter) => result.atc2Code && result.atc2Code.trim() === filter.id);
          if(indexATC2 === -1) {
            newATCFilters[indexATC].children.unshift({
              id: result.atc2Code.trim(),
              name: result.atc2Label.trim(),
              count: 1,
              selected: false,
            });
          } else {
            newATCFilters[indexATC].children[indexATC2].count += 1;
          }
          newATCFilters[indexATC].count += 1;
        }
      }
      if(result.indicationsDetails && result.indicationsDetails.length > 0) {
        result.indicationsDetails.forEach((indicationDetail) => {
          const indexIndication = newIndicationsFilters.findIndex((filter: SearchFilter) => indicationDetail.idIndication.toString() === filter.id && indicationDetail.nomIndication.trim() === filter.name);
          if(indexIndication === -1) {
            newIndicationsFilters.push({
              id: indicationDetail.idIndication.toString(),
              name: indicationDetail.nomIndication.trim(),
              count: 1,
              selected: false,
            });
          } else {
            newIndicationsFilters[indexIndication].count += 1;
          }
        });
      }
    });
    setAllSubsFilters(onSortFilters(newSubsFilters));
    setCurrentSubsFilters(newSubsFilters);
    setAllAtcFilters(onSortFilters(newATCFilters));
    setCurrentAtcFilters(newATCFilters);
    setAllIndicationsFilters(onSortFilters(newIndicationsFilters));
    setCurrentIndicationsFilters(newIndicationsFilters);
  }, [resultsList, setAllSubsFilters, setCurrentSubsFilters, setAllAtcFilters, setCurrentAtcFilters, setAllIndicationsFilters, setCurrentIndicationsFilters, onSortFilters]);

  const onUpdateAllFilters = useCallback((
    newResultsList: SearchResultItem[],
    subsFilters: SearchFilter[],
    atcFilters: SearchFilter[],
    indicationsFilters: SearchFilter[],
  ) => {
    const newSubsFilters: SearchFilter[] = subsFilters.map((filter) => ({...filter, count: 0}));
    const newAtcFilters: SearchFilter[] = atcFilters.map((filter) => ({
      ...filter,
      count: 0,
      children: filter.children && filter.children.map((childFilter) => ({...childFilter, count: 0}))
    }));
    const newIndicationsFilters: SearchFilter[] = indicationsFilters.map((filter) => ({...filter, count: 0}));
    newResultsList.forEach((result) => {
      //Substances
      const indexSubs = newSubsFilters.findIndex((filter: SearchFilter) => result.composants.trim() === filter.id);
      if(indexSubs !== -1) {
        newSubsFilters[indexSubs].count += 1;
      }
      // ATC 1 & 2
      const indexATC = newAtcFilters.findIndex((filter: SearchFilter) => result.atc1Code && result.atc1Code.trim() === filter.id);
      if(indexATC !== -1) {
        if(result.atc2Label && result.atc2Code && newAtcFilters[indexATC].children) {
          const indexATC2 = newAtcFilters[indexATC].children.findIndex((filter) => result.atc2Code && result.atc2Code.trim() === filter.id);
          if(indexATC2 !== -1) {
            newAtcFilters[indexATC].children[indexATC2].count += 1;
            newAtcFilters[indexATC].count += 1;
          }
        }
      }
      //Indications
      result.indicationsDetails && result.indicationsDetails.forEach((indicationDetail) => {
      const indexIndication = newIndicationsFilters.findIndex((filter: SearchFilter) => indicationDetail.idIndication.toString() === filter.id && indicationDetail.nomIndication.trim() === filter.name);
      if(indexIndication !== -1) {
        newIndicationsFilters[indexIndication].count += 1;
      }
    })
    });
    setAllSubsFilters(onSortFilters(newSubsFilters));
    setAllAtcFilters(onSortFilters(newAtcFilters));
    setAllIndicationsFilters(onSortFilters(newIndicationsFilters));
  }, [setAllSubsFilters, setAllAtcFilters, setAllIndicationsFilters, onSortFilters]);

  //Update the results list after filters updates
  useEffect(() => {
    const subsFilters = currentSubsFilters.filter((filter) => filter.selected);
    const atcsFilters = currentAtcFilters.filter((filter) => filter.selected);
    const indicationsFilters = currentIndicationsFilters.filter((filter) => filter.selected);
    const newResultsList = resultsList
      .filter((result) => {
        if(subsFilters.length > 0) {
          //Filter on composants only if there is composants
          const findComposant = subsFilters.find((filter: SearchFilter) => filter.id === result.composants.trim());
          if(!findComposant) return false;
        }
        if(atcsFilters.length > 0){
          //Filter on atc only if there is atc
          const findATC = atcsFilters.find((filter: SearchFilter) => {
            if(filter.id === result.atc1Code?.trim() && filter.children) {
              return filter.children.find((childrenFilter) => childrenFilter.selected && childrenFilter.id === result.atc2Code?.trim());
            } else return false;
          });
          if(!findATC) return false;
        }
        if(indicationsFilters.length > 0) {
          //Filter on indication only if there is indication
          if(result.indicationsDetails && result.indicationsDetails.length > 0){
            let find: boolean = false;
            result.indicationsDetails.forEach((indicationDetail) => {
              const findIndication = indicationsFilters.findIndex(
                (filter: SearchFilter) => filter.id === indicationDetail.idIndication.toString() && filter.name === indicationDetail.nomIndication.trim()
              );
              if(findIndication !== -1){
                find = true;
              } 
            });
            return find;
          }
        }
        return true;
      })
      .sort((a, b) => { 
        if(currentSortType === "alphabetic") {
          if(isSortAsc) return a.groupName.localeCompare(b.groupName, "fr")
          else return b.groupName.localeCompare(a.groupName, "fr")
        }
        else {
          if(isSortAsc) {
            if (a.score !== b.score) return b.score - a.score;
            return a.groupName.localeCompare(b.groupName, "fr");
          } else {
            if (a.score !== b.score) return a.score - b.score;
            return b.groupName.localeCompare(a.groupName, "fr");
          }
        }
      });
    setFilteredResultsList(newResultsList);
    onUpdateAllFilters(newResultsList, currentSubsFilters, currentAtcFilters, currentIndicationsFilters);
  }, [resultsList, currentSortType, isSortAsc, currentSubsFilters, currentAtcFilters, currentIndicationsFilters, setFilteredResultsList, onUpdateAllFilters]);


  const onChangeSubsFilter = (filter: SearchFilter, checked: boolean) => {
    const subsIndex = allSubsFilters.findIndex((subsFilter) => filter.id === subsFilter.id);
    if(subsIndex !== -1) {
      const updatedSubsFilters = [...allSubsFilters];
      updatedSubsFilters[subsIndex].selected = checked;
      setAllSubsFilters(updatedSubsFilters);
      setCurrentSubsFilters(updatedSubsFilters);
    }
  };
  
  const onChangeATCFilter = (filter: SearchFilter, checked: boolean) => {
    const atcIndex = allAtcFilters.findIndex((atcFilter) => filter.id === atcFilter.id);
    if(atcIndex !== -1) {
      const updatedAtcFilters = [...allAtcFilters];
      updatedAtcFilters[atcIndex].selected = checked;
      updatedAtcFilters[atcIndex].children && updatedAtcFilters[atcIndex].children.forEach((childFilter) => {
        childFilter.selected = checked;
      });
      setAllAtcFilters(updatedAtcFilters);
      setCurrentAtcFilters(updatedAtcFilters);
    }
  };

  const onChangeATC2Filter = (atcFilter: SearchFilter, atc2Filter: SearchFilter, checked: boolean) => {
    //Update atc list
    const atcIndex = allAtcFilters.findIndex((filter) => atcFilter.id === filter.id);
    if(atcIndex !== -1) {
      const updatedAtcFilters = [...allAtcFilters];
      const atc2Index = allAtcFilters[atcIndex].children 
        ? allAtcFilters[atcIndex].children.findIndex((childrenFilter) => atc2Filter.id === childrenFilter.id) 
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
        setCurrentAtcFilters(updatedAtcFilters);
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
      setCurrentIndicationsFilters(updatedIndicationsFilters);
    }
  };

  const onUnselectAll = () => {
    //Substances
    const updatedSubsFilters = allSubsFilters.map((filter) => ({...filter, selected: false}));
    setAllSubsFilters(updatedSubsFilters);
    setCurrentSubsFilters(updatedSubsFilters);
    //ATC 1 & 2
    const updatedAtcFilters: SearchFilter[] = allAtcFilters.map((filter) => ({
      ...filter,
      selected: false,
      children: filter.children && filter.children.map((childFilter) => ({...childFilter, selected: false}))
    }));
    setAllAtcFilters(updatedAtcFilters);
    setCurrentAtcFilters(updatedAtcFilters);
    //Indications
    const updatedIndicationsFilters = allIndicationsFilters.map((filter) => ({...filter, selected: false}));
    setAllIndicationsFilters(updatedIndicationsFilters);
    setCurrentIndicationsFilters(updatedIndicationsFilters);
  };

  return (
    <Container className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-12")}>
        <FiltersTitle className={fr.cx("fr-mb-3w", "fr-text--md")}>
          {filteredResultsList.length} résultat{filteredResultsList.length > 1 && 's'}
          {" "}pour{" "}
          <strong>“{search}“</strong>
        </FiltersTitle>
      </div>
      <FiltersContainer className={fr.cx("fr-col-12", "fr-col-md-4")}>
        <FiltersContainerTitleBlock>
          <FiltersContainerTitle className={fr.cx("fr-h6")}>
            <span 
              className={fr.cx("fr-icon-filter-fill", "fr-mr-1w")}
              style={{color: "var(--text-default-info)"}}
            />
            Filtres
          </FiltersContainerTitle>
          {(currentSubsFilters.filter((filter) => filter.selected).length > 0 
            || currentAtcFilters.filter((filter) => filter.selected).length > 0 
            || currentIndicationsFilters.filter((filter) => filter.selected).length > 0) && (
            <Link 
              className={fr.cx("fr-link", "fr-text--sm")}
              href=""
              onClick={onUnselectAll}
            >
              Effacer tous les filtres
            </Link>
          )}
        </FiltersContainerTitleBlock>
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
      <div className={fr.cx("fr-col-12", "fr-col-md-8", "fr-pl-3w")}>
        <SortContainer className={fr.cx("fr-mb-3w")}>
          Trier par{" "}
          {currentSortType !== "alphabetic" 
            ? (
              <Link
                href=""
                onClick={() => setCurrentSortType("alphabetic")}
                className={fr.cx("fr-text--sm")} 
              >
                ordre alphabétique
              </Link>
            )
            : (<span className={fr.cx("fr-text--sm", "fr-text--bold")}>ordre alphabétique</span>)
          }{" / "}
          {currentSortType !== "score" 
            ? (
              <Link
                href=""
                onClick={() => setCurrentSortType("score")}
                className={fr.cx("fr-text--sm")} 
              >
                pertinence
              </Link>
            )
            : (<span className={fr.cx("fr-text--sm", "fr-text--bold")}>pertinence</span>)
          }
          <Button
            iconId={isSortAsc ? "fr-icon-arrow-down-line" : "fr-icon-arrow-up-line"}
            onClick={() => setIsSortAsc(!isSortAsc)}
            priority="tertiary no outline"
            title={`Trier par ordre ${isSortAsc ? "décroissant" : "croissant"}`}
            size="small"
          />
        </SortContainer>
        {filteredResultsList && filteredResultsList.map((result, index) => (
          <DataBlockAccordion
            key={index}
            item={result}
            matchReasons={result.matchReasons}
            withAlert
          />
        ))}
      </div>
    </Container>
  );
};

export default SearchResultsList;
