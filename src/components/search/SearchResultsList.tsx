"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import DataBlockAccordion from "../data/DataBlockAccordion";
import { SearchResultItem } from "@/db/utils/search";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { ShortPatho } from "@/types/PathoTypes";

type ATC2Filter = {
  atc2Label: string,
  atc2Code: string,
}

type ATCFilter = {
  atc1Label: string,
  atc1Code: string,
  atc2List: ATC2Filter[],
}

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
const FilterTitle = styled.div`
  background-color: var(--background-default-grey);
  padding: 0.5rem;
  border: var(--border-action-high-grey) 2px solid;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--text-label-grey);
`;

const ResultsContainer = styled.div`
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: SearchResultItem[];
}

function SearchResultsList({
  resultsList,
}: SearchResultsListProps) {

  const [composantsList, setComposantsList] = useState<string[]>([]);
  const [composantsFilterList, setComposantsFilterList] = useState<string[]>([]);
  const [atcList, setAtcList] = useState<ATCFilter[]>([]);
  const [atcFilterList, setAtcFilterList] = useState<ATCFilter[]>([]);
  const [pathosList, setPathosList] = useState<ShortPatho[]>([]);
  const [pathosFilterList, setPathosFilterList] = useState<ShortPatho[]>([]);
  const [filteredResultsList, setFilteredResultsList] = useState<SearchResultItem[]>(resultsList);

  useEffect(() => {
    const composants: string[] = [];
    const atcs: ATCFilter[] = [];
    const pathos: ShortPatho[] = [];
    resultsList.forEach((result) => {
      //Substances List
      if(result.composants) {
        const indexSubs = composants.findIndex((composant) => result.composants.trim() === composant);
        if(indexSubs === -1)
          composants.push(result.composants.trim());
      }
      //ATC 1 & 2 List
      const indexATC = atcs.findIndex((atc) => result.atc1Code && result.atc1Code.trim() === atc.atc1Code);
      if(indexATC === -1) {
        if(result.atc1Label && result.atc1Code){
          //New ATC in the list
          atcs.push({
            atc1Label: result.atc1Label.trim(),
            atc1Code: result.atc1Code.trim(),
            atc2List: (result.atc2Code && result.atc2Label) ? [{
              atc2Code: result.atc2Code.trim(),
              atc2Label: result.atc2Label.trim(),
            }] : [],
          });
        }
      } else {
        //ATC 1 exists, test for ATC2
        const indexATC2 = atcs[indexATC].atc2List.findIndex((atc) => result.atc2Code && result.atc2Code.trim() === atc.atc2Code);
        if(indexATC2 === -1 && result.atc2Label && result.atc2Code) {
          atcs[indexATC].atc2List.push({
            atc2Code: result.atc2Code.trim(),
            atc2Label: result.atc2Label.trim(),
          });
        }
      }
      //Pathos List
      if(result.pathosDetails) {
        result.pathosDetails.forEach((pathoDetail) => {
          const indexPatho = pathos.findIndex((patho) => pathoDetail.codePatho === patho.codePatho && pathoDetail.NomPatho.trim() === patho.NomPatho.trim());
          if(indexPatho === -1)
            pathos.push(pathoDetail);
        });
      }
    });
    composants.sort((a,b) => a.localeCompare(b));
    setComposantsList(composants);
    setComposantsFilterList(composants);

    atcs.sort((a,b) => a.atc1Label.localeCompare(b.atc1Label));
    setAtcList(atcs);
    setAtcFilterList(atcs);

    pathos.sort((a,b) => a.NomPatho.localeCompare(b.NomPatho));
    setPathosList(pathos);
    setPathosFilterList(pathos);
  }, [resultsList, setComposantsList, setComposantsFilterList, setAtcList, setAtcFilterList, setPathosList, setPathosFilterList]);

  useEffect(() => {
    const newResultsList = resultsList.filter((result) => {
      if(composantsList.length > 0) {
        //Filter on composants only if there is composants
        const findComposant = composantsFilterList.find((composants) => composants === result.composants.trim());
        if(!findComposant) return false;
      }
      if(atcList.length > 0){
        //Filter on atc only if there is atc
        const findATC = atcFilterList.find((atc) => {
          if(atc.atc1Code === result.atc1Code) {
            return atc.atc2List.find((atc2) => atc2.atc2Code === result.atc2Code);
          } else return false;
        });
        if(!findATC) return false;
      }
      if(pathosList.length > 0 && result.pathosDetails) {
        //Filter on patho only if there is patho
        let find: boolean = false;
        result.pathosDetails.forEach((pathoDetail) => {
          const indexPatho = pathosFilterList.findIndex((patho) => pathoDetail.codePatho === patho.codePatho && pathoDetail.NomPatho.trim() === patho.NomPatho.trim());
          if(indexPatho !== -1) find = true;
        });
        return find;
      }
      return true;
    })
    setFilteredResultsList(newResultsList);
  }, [resultsList, composantsList, composantsFilterList, atcList, atcFilterList, pathosList, pathosFilterList, setFilteredResultsList])

  const onChangeSubsFilter = (composants: string, checked: boolean) => {
    //Update composants list
    if (checked) {
      setComposantsFilterList([...composantsFilterList, composants]);
    } else {
      setComposantsFilterList(composantsFilterList.filter((filterComposants) => filterComposants !== composants));
    }
  };

  const onChangeATCFilter = (atc: ATCFilter, checked: boolean) => {
    //Update atc list
    if (checked) {
      setAtcFilterList([...atcFilterList, atc]);
    } else {
      setAtcFilterList(atcFilterList.filter((filterAtc) => filterAtc.atc1Code !== atc.atc1Code));
    }
  };

  const isATC2Checked = (atc: ATCFilter, filterList: ATCFilter[]) => {
    const findIndex = filterList.findIndex((atcFilter) => atcFilter.atc1Code === atc.atc1Code);
    if(findIndex === -1) return false;
    return true;
  }
  const onChangeATC2Filter = (atc1: ATCFilter, atc2: ATC2Filter, checked: boolean) => {
    //Update atc list
    const newAtc: ATCFilter = {...atc1};
    if (checked) {
      [...newAtc.atc2List, atc2];
    } else {
      newAtc.atc2List = newAtc.atc2List.filter((filterAtc) => filterAtc.atc2Code !== atc2.atc2Code);
    }
    const findIndex = atcFilterList.findIndex((atcFilter) => atcFilter.atc1Code === newAtc.atc1Code);
    if(findIndex === -1){
      setAtcFilterList([...atcFilterList, newAtc]);
    } else {
      //Ici avec l'index
      const newFilters = [...atcFilterList];
      newFilters[findIndex] = newAtc;
      setAtcFilterList(newFilters);
    }
  };

  const onChangePathoFilter = (patho: ShortPatho, checked: boolean) => {
    //Update composants list
    if (checked) {
      setPathosFilterList([...pathosFilterList, patho]);
    } else {
      setPathosFilterList(pathosFilterList.filter(
        (filterPatho) => filterPatho.codePatho !== patho.codePatho && filterPatho.NomPatho.trim() !== patho.NomPatho.trim()
      ));
    }
  };


  return (
    <Container className={fr.cx("fr-grid-row")}>
      <FiltersContainer className={fr.cx("fr-col-12", "fr-col-md-4")}>
        {(composantsList && composantsList.length) > 0 && (
          <div className={fr.cx("fr-mb-2w")}>
            <FilterTitle>Filtrer par substance active</FilterTitle>
            <Checkbox
              options={composantsList.map((composants) => 
                ({
                  label: composants,
                  nativeInputProps: {
                    defaultChecked: true,
                    onClick:(e) => onChangeSubsFilter(composants, (e.target as any).checked),
                  },
                })
              )}
              small
            />
          </div>
        )}
        {(atcList && atcList.length > 0) && (
          <div className={fr.cx("fr-mb-2w")}>
            <FilterTitle>Filtrer par la classe et sous-classe</FilterTitle>
            {atcList.map((atc: ATCFilter, index: number) => (
              <div key={index}>
                <Checkbox
                  options={[{
                    label: atc.atc1Label,
                    nativeInputProps: {
                      defaultChecked: true,
                      onClick: (e) => onChangeATCFilter(atc, (e.target as any).checked),
                    },
                  }]}
                  small
                />
                {(atc.atc2List && atc.atc2List.length > 0) && (
                  <Checkbox
                    className={fr.cx("fr-ml-2w")}
                    options={atc.atc2List.map((atc2) => 
                      ({
                        label: atc2.atc2Label,
                        nativeInputProps: {
                          defaultChecked: isATC2Checked(atc, atcFilterList),//TODO KO
                          onClick: (e) => onChangeATC2Filter(atc, atc2, (e.target as any).checked),
                        },
                      })
                    )}
                    small
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {(pathosList && pathosList.length > 0) && (
          <div className={fr.cx("fr-mb-2w")}>
            <FilterTitle>Filtrer par pathologie</FilterTitle>
            <Checkbox
              options={pathosList.map((patho) => 
                ({
                  label: patho.NomPatho,
                  nativeInputProps: {
                    defaultChecked: true,
                    onClick:(e) => onChangePathoFilter(patho, (e.target as any).checked),
                  },
                })
              )}
              small
            />
          </div>
        )}
      </FiltersContainer>
      <ResultsContainer className={fr.cx("fr-col-12", "fr-col-md-8", "fr-pl-3w")}>
        <div className={fr.cx("fr-text--bold", "fr-mb-3w")}>
          {filteredResultsList.length} résultat{filteredResultsList.length > 1 && 's'}
        </div>
        {filteredResultsList && filteredResultsList.map((result, index) => (
          <DataBlockAccordion
            key={index}
            item={result}
            matchReasons={result.matchReasons}
            filterPregnancy={true}
            filterPediatric={true}
            withAlert
          />
        ))}
      </ResultsContainer>
    </Container>
  );
};

export default SearchResultsList;
