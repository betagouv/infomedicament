"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import DataBlockAccordion from "../data/DataBlockAccordion";
import { SearchResultItem } from "@/db/utils/search";
import Link from "next/link";
import Button from "@codegouvfr/react-dsfr/Button";
import { ATCSearchFilter, SearchFilter } from "@/types/SpecialiteTypes";
import SearchFilterBlock from "./blocks/SearchFilterBlock";
import SearchATCFilterBlock from "./blocks/SearchATCFilterBlock";

type SortType = "alphabetic" | "score";

const Container = styled.div `
  .display-inline {
    display: inline;
  }
`;
const FiltersContainer = styled.div`
  padding: 1rem 2rem;
  background-color: var(--background-alt-blue-france);
  .fr-fieldset__content .fr-checkbox-group label {
    font-size: 0.875rem !important;
    padding-bottom: 0px;
  }
`;
const SortContainer = styled.div`
  text-align: right;
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: SearchResultItem[];
}

function SearchResultsList({
  resultsList,
}: SearchResultsListProps) {

  const [filteredResultsList, setFilteredResultsList] = useState<SearchResultItem[]>([]);

  const [subsFilters, setSubsFilters] = useState<SearchFilter[]>([]);
  const [subsFiltersList, setSubsFiltersList] = useState<string[]>([]);
  const [atcFilters, setAtcFilters] = useState<ATCSearchFilter[]>([]);
  const [atcFiltersList, setAtcFiltersList] = useState<ATCSearchFilter[]>([]);
  const [indicationsFilters, setIndicationsFilters] = useState<SearchFilter[]>([]);
  const [indicationsFiltersList, setIndicationsFiltersList] = useState<SearchFilter[]>([]);

  const [currentSortType, setCurrentSortType] = useState<SortType>("score");
  const [isSortAsc, setIsSortAsc] = useState<boolean>(true);

  useEffect(() => {
    const newSubsFilters: SearchFilter[] = [];
    const newATCFilters: ATCSearchFilter[]= [];
    const newIndicationsFilters: SearchFilter[] = [];
    resultsList.forEach((result) => {
      //Substances List
      if(result.composants) {
        const indexSubs = newSubsFilters.findIndex((filter: SearchFilter) => result.composants.trim() === filter.id);
        if(indexSubs === -1) {
          newSubsFilters.push({
            id: result.composants.trim(),
            name: result.composants.trim(), 
            count: 1,
          });
        } else {
          newSubsFilters[indexSubs].count += 1;
        }
      }
      //ATC 1 & 2 List
      const indexATC = newATCFilters.findIndex((filter: ATCSearchFilter) => result.atc1Code && result.atc1Code.trim() === filter.id);
      if(indexATC === -1) {
        if(result.atc1Label && result.atc1Code){
          //New ATC in the list
          newATCFilters.push({
            id: result.atc1Code.trim(),
            name: result.atc1Label.trim(),
            count: 1,
            children: (result.atc2Code && result.atc2Label) ? [{
              id: result.atc2Code.trim(),
              name: result.atc2Label.trim(),
              count: 1,
            }] : [],
          });
        }
      } else {
        newATCFilters[indexATC].count += 1;
        if(result.atc2Label && result.atc2Code) {
          //ATC 1 exists, test for ATC2
          const indexATC2 = newATCFilters[indexATC].children.findIndex((filter) => result.atc2Code && result.atc2Code.trim() === filter.id);
          if(indexATC2 === -1) {
            newATCFilters[indexATC].children.unshift({
              id: result.atc2Code.trim(),
              name: result.atc2Label.trim(),
              count: 1,
            });
          } else {
            newATCFilters[indexATC].children[indexATC2].count += 1;
          }
        }
      }
      //Indications List
      if(result.pathosDetails && result.pathosDetails.length > 0) {
        result.pathosDetails.forEach((indicationDetail) => {
          const indexIndication = newIndicationsFilters.findIndex((filter: SearchFilter) => indicationDetail.codePatho.trim() === filter.id && indicationDetail.NomPatho.trim() === filter.name);
          if(indexIndication === -1) {
            newIndicationsFilters.push({
              id: indicationDetail.codePatho.trim(),
              name: indicationDetail.NomPatho.trim(),
              count: 1,
            });
          } else {
            newIndicationsFilters[indexIndication].count += 1;
          }
        });
      }
    });
    newSubsFilters.sort((a,b) => a.name.localeCompare(b.name));
    setSubsFilters(newSubsFilters);
    newATCFilters.forEach((filter: ATCSearchFilter) => {
      filter.children.sort((a,b) => a.name.localeCompare(b.name));
    });
    newATCFilters.sort((a,b) => a.name.localeCompare(b.name));
    setAtcFilters(newATCFilters);
    newIndicationsFilters.sort((a,b) => a.name.localeCompare(b.name));
    setIndicationsFilters(newIndicationsFilters);
  }, [resultsList, setSubsFilters, setAtcFilters, setIndicationsFilters]);

  useEffect(() => {
    const newResultsList = resultsList
      .filter((result) => {
        if(subsFilters.length > 0 && subsFiltersList.length > 0) {
          //Filter on composants only if there is composants
          const findComposant = subsFiltersList.find((filter: string) => filter === result.composants.trim());
          if(!findComposant) return false;
        }
        if(atcFilters.length > 0 && atcFiltersList.length > 0){
          //Filter on atc only if there is atc
          const findATC = atcFiltersList.find((filter: ATCSearchFilter) => {
            if(filter.id === result.atc1Code?.trim()) {
              return filter.children.find((childrenFilter) => childrenFilter.id === result.atc2Code?.trim());
            } else return false;
          });
          if(!findATC) return false;
        }
        if(indicationsFilters.length > 0 && indicationsFiltersList.length > 0) {
          //Filter on indication only if there is indication
          if(result.pathosDetails && result.pathosDetails.length > 0){
            let find: boolean = false;
            result.pathosDetails.forEach((indicationDetail) => {
              const findPatho = indicationsFiltersList.findIndex((filter: SearchFilter) => filter.id === indicationDetail.codePatho.trim() && filter.name === indicationDetail.NomPatho.trim());
              if(findPatho !== -1){
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
  }, [resultsList, currentSortType, isSortAsc, subsFilters, subsFiltersList, atcFilters, atcFiltersList, indicationsFilters, indicationsFiltersList, setFilteredResultsList])

  const onChangeSubsFilter = (filter: SearchFilter, checked: boolean) => {
    if (checked) {
      setSubsFiltersList([...subsFiltersList, filter.id]);
    } else {
      setSubsFiltersList(subsFiltersList.filter((subs) => subs !== filter.id));
    }
  };
  const onChangeATCFilter = (filter: ATCSearchFilter, checked: boolean) => {
    //Update atc list
    if (checked) {
      setAtcFiltersList([...atcFiltersList, filter]);
    } else {
      setAtcFiltersList(atcFiltersList.filter((atc) => filter.id !== atc.id));
    }
  };

  const onChangeATC2Filter = (atcFilter: ATCSearchFilter, atc2Filter: SearchFilter, checked: boolean) => {
    //Update atc list
    const atcIndex = atcFiltersList.findIndex((filter) => atcFilter.id === filter.id);
    if(checked) {
      if(atcIndex !== -1) {
        //Add atc2 filter to the existing list
        atcFiltersList[atcIndex].children.push(atc2Filter);
        setAtcFiltersList([...atcFiltersList]);
      }
      else {
        //Add atc1 et atc2 to the list
        setAtcFiltersList([
          ...atcFiltersList, 
          {
            ...atcFilter,
            children: [atc2Filter],
          }
        ]);
      }
    } else if(atcIndex !== -1) {
      const atc2Index = atcFiltersList[atcIndex].children.findIndex((childrenFilter) => atc2Filter.id === childrenFilter.id);
      if(atc2Index !== -1) {
        const newAtcFiltersList = [...atcFiltersList];
        newAtcFiltersList[atcIndex].children = newAtcFiltersList[atcIndex].children.filter((childrenFilter) => atc2Filter.id !== childrenFilter.id);
        if(atcFiltersList[atcIndex].children.length === 0){
          //Remove atc1 from the list - no atc2 anymore is checked
          setAtcFiltersList(newAtcFiltersList.filter((atc) => atcFilter.id !== atc.id));
        } else {
          //Only remove atc2 from the list
          setAtcFiltersList([...newAtcFiltersList]);
        }
      }
    }
  };
  const onChangeIndicationsFilter = (filter: SearchFilter, checked: boolean) => {
    if (checked) {
      setIndicationsFiltersList([...indicationsFiltersList, filter]);
    } else {
      setIndicationsFiltersList(indicationsFiltersList.filter(
        (indication) => {
          if(indication.id !== filter.id || indication.name !== filter.name) {
            return true;
          } else {  
            return false;
          }
        }
      ));
    }
  };

  const isATC1Checked = (atcId: string) => {
    const findIndex = atcFiltersList.findIndex((filter) => filter.id === atcId);
    if(findIndex === -1) return false;
    return true;
  }

  const isATC2Checked = (atcId: string, atc2Id: string) => {
    const findIndex = atcFiltersList.findIndex((filter) => filter.id === atcId);
    if(findIndex === -1) return false;
    const findIndex2 = atcFiltersList[findIndex].children.findIndex((childrenFilter) => childrenFilter.id === atc2Id);
    if(findIndex2 === -1) return false;
    return true;
  }

  return (
    <Container className={fr.cx("fr-grid-row")}>
      <FiltersContainer className={fr.cx("fr-col-12", "fr-col-md-4")}>
        <SearchFilterBlock
          filtersList={subsFilters}
          title="Filtrer par substance active"
          onClickFilter={onChangeSubsFilter}
        />
        <SearchATCFilterBlock
          filtersList={atcFilters}
          title="Filtrer par classe et sous-classe"
          isATC1Checked={isATC1Checked}
          onChangeATCFilter={onChangeATCFilter}
          isATC2Checked={isATC2Checked}
          onChangeATC2Filter={onChangeATC2Filter}
        />
        <SearchFilterBlock
          filtersList={indicationsFilters}
          title="Filtrer par indication"
          onClickFilter={onChangeIndicationsFilter}
        />
      </FiltersContainer>
      <div className={fr.cx("fr-col-12", "fr-col-md-8", "fr-pl-3w")}>
        <div className={fr.cx("fr-text--bold", "fr-mb-3w")}>
          {filteredResultsList.length} résultat{filteredResultsList.length > 1 && 's'}
        </div>
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
                popularité
              </Link>
            )
            : (<span className={fr.cx("fr-text--sm", "fr-text--bold")}>popularité</span>)
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
