"use client";

import { HTMLAttributes, useCallback, useMemo, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from "styled-components";
import { SearchFilter, SearchResultItem, SortType } from "@/types/SearchTypes";
import SearchResultsPagination from "./blocks/SearchResultsPagination";
import SearchFiltersContainer from "./blocks/SearchFiltersContainer";
import SearchSortBlock from "./blocks/SearchSortBlock";
import SearchFiltersSubMenu from "./blocks/SearchFiltersSubMenu";

const SearchResultsListContainer = styled.div`
  & .display-inline {
    display: inline;
  }
  & .search-results-list-accordion > .fr-collapse--expanded {
    padding-top: 0;
  }
`;

const FiltersTitle = styled.h1`
  font-weight: normal;
`;

const FiltersColumn = styled.div`
  @media (min-width: 48em) {
    flex: 0 0 292px;
    width: 292px;
  }
`;

const ResultsContainer = styled.div`
  @media (min-width: 48em) {
    flex: 1 1 auto !important;
    min-width: 0;
    width: calc(100% - 260px - 2rem) !important;
  }
`;

interface SearchResultsListProps extends HTMLAttributes<HTMLDivElement> {
  advanced?: boolean;
  resultsList: SearchResultItem[];
  search?: string;
}

// Counts and labels come from results; only selected identities are stored.
function useSelectedFilters(available: SearchFilter[], source: SearchResultItem[]) {
  const [selection, setSelection] = useState<{ source: SearchResultItem[]; ids: Set<string> }>(
    () => ({ source, ids: new Set() }),
  );
  const filters = useMemo(() => {
    function apply(items: SearchFilter[], parent = ""): SearchFilter[] {
      return items.map((item) => {
        const identity = JSON.stringify([parent, item.id, item.name]);
        return {
          ...item,
          selected: selection.source === source && selection.ids.has(identity),
          ...(item.children ? { children: apply(item.children, identity) } : {}),
        };
      });
    }
    return apply(available);
  }, [available, source, selection]);
  const update = useCallback((items: SearchFilter[]) => {
    const ids = new Set<string>();
    function collect(items: SearchFilter[], parent = "") {
      items.forEach((item) => {
        const identity = JSON.stringify([parent, item.id, item.name]);
        if (item.selected) ids.add(identity);
        if (item.children) collect(item.children, identity);
      });
    }
    collect(items);
    setSelection({ source, ids });
  }, [source]);
  return [filters, update] as const;
}

function SearchResultsList({
  advanced = false,
  resultsList,
  search,
}: SearchResultsListProps) {
  const [sortType, setSortType] = useState<SortType>(
    advanced ? "alphabetic" : "score",
  );
  const [isSortAsc, setIsSortAsc] = useState<boolean>(true);

  const availableFilters = useMemo(() => {
    const newSubsFilters: SearchFilter[] = [];
    const newATCFilters: SearchFilter[] = [];
    const newIndicationsFilters: SearchFilter[] = [];
    resultsList.forEach((result) => {
      if (result.composants) {
        const indexSubs = newSubsFilters.findIndex(
          (filter: SearchFilter) => result.composants.trim() === filter.id,
        );
        if (indexSubs === -1) {
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
      const indexATC = newATCFilters.findIndex(
        (filter: SearchFilter) =>
          result.atc1Code && result.atc1Code.trim() === filter.id,
      );
      if (indexATC === -1) {
        if (result.atc1Label && result.atc1Code) {
          //New ATC in the list
          newATCFilters.push({
            id: result.atc1Code.trim(),
            name: result.atc1Label.trim(),
            count: 1,
            selected: false,
            children:
              result.atc2Code && result.atc2Label
                ? [
                    {
                      id: result.atc2Code.trim(),
                      name: result.atc2Label.trim(),
                      count: 1,
                      selected: false,
                    },
                  ]
                : [],
          });
        }
      } else {
        if (
          result.atc2Label &&
          result.atc2Code &&
          newATCFilters[indexATC].children
        ) {
          //ATC 1 exists, test for ATC2
          const indexATC2 = newATCFilters[indexATC].children.findIndex(
            (filter) => result.atc2Code && result.atc2Code.trim() === filter.id,
          );
          if (indexATC2 === -1) {
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
      if (result.indicationsDetails && result.indicationsDetails.length > 0) {
        result.indicationsDetails.forEach((indicationDetail) => {
          const indexIndication = newIndicationsFilters.findIndex(
            (filter: SearchFilter) =>
              indicationDetail.idIndication.toString() === filter.id &&
              indicationDetail.nomIndication.trim() === filter.name,
          );
          if (indexIndication === -1) {
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
    return { substances: newSubsFilters, atcs: newATCFilters, indications: newIndicationsFilters };
  }, [resultsList]);
  const [allSubsFilters, setAllSubsFilters] = useSelectedFilters(availableFilters.substances, resultsList);
  const [allAtcFilters, setAllAtcFilters] = useSelectedFilters(availableFilters.atcs, resultsList);
  const [allIndicationsFilters, setAllIndicationsFilters] = useSelectedFilters(availableFilters.indications, resultsList);

  //Update the results list after filters updates
  const filteredResultsList = useMemo(() => {
    const subsFilters = allSubsFilters.filter((filter) => filter.selected);
    const atcsFilters = allAtcFilters.filter((filter) => filter.selected);
    const indicationsFilters = allIndicationsFilters.filter(
      (filter) => filter.selected,
    );
    const newResultsList = resultsList
      .filter((result) => {
        if (subsFilters.length > 0) {
          //Filter on composants only if there is composants
          const findComposant = subsFilters.find(
            (filter: SearchFilter) => filter.id === result.composants.trim(),
          );
          if (!findComposant) return false;
        }
        if (atcsFilters.length > 0) {
          //Filter on atc only if there is atc
          const findATC = atcsFilters.find((filter: SearchFilter) => {
            if (filter.id === result.atc1Code?.trim() && filter.children) {
              return filter.children.find(
                (childrenFilter) =>
                  childrenFilter.selected &&
                  childrenFilter.id === result.atc2Code?.trim(),
              );
            } else return false;
          });
          if (!findATC) return false;
        }
        if (indicationsFilters.length > 0) {
          //Filter on indication only if there is indication
          let find: boolean = false;
          if (
            result.indicationsDetails &&
            result.indicationsDetails.length > 0
          ) {
            result.indicationsDetails.forEach((indicationDetail) => {
              const findIndication = indicationsFilters.findIndex(
                (filter: SearchFilter) =>
                  filter.id === indicationDetail.idIndication.toString() &&
                  filter.name === indicationDetail.nomIndication.trim(),
              );
              if (findIndication !== -1) {
                find = true;
              }
            });
          }
          return find;
        }
        return true;
      })
      .sort((a, b) => {
        if (advanced || sortType === "alphabetic") {
          const nameA = advanced ? a.specName : a.groupName;
          const nameB = advanced ? b.specName : b.groupName;
          if (isSortAsc) return nameA.localeCompare(nameB, "fr");
          else return nameB.localeCompare(nameA, "fr");
        } else {
          if (isSortAsc) {
            if (a.score !== b.score) return b.score - a.score;
            return a.groupName.localeCompare(b.groupName, "fr");
          } else {
            if (a.score !== b.score) return a.score - b.score;
            return b.groupName.localeCompare(a.groupName, "fr");
          }
        }
      });
    return newResultsList;
  }, [
    resultsList,
    advanced,
    sortType,
    isSortAsc,
    allSubsFilters,
    allAtcFilters,
    allIndicationsFilters,
  ]);

  const getSelectedFiltersCount = (): number => {
    return (
      allSubsFilters.filter((filter) => filter.selected).length +
      allAtcFilters.filter((filter) => filter.selected).length +
      allIndicationsFilters.filter((filter) => filter.selected).length
    );
  };

  return (
    <SearchResultsListContainer className={[fr.cx("fr-grid-row")].join(" ")}>
      <div className={fr.cx("fr-col-12")}>
        <FiltersTitle className={fr.cx("fr-mb-3w", "fr-text--md")}>
          {filteredResultsList.length} résultat
          {filteredResultsList.length > 1 && "s"}
          {search && (
            <>
              {" "}
              pour : <strong>“{search}“</strong>
            </>
          )}
        </FiltersTitle>
      </div>
      <div
        className={fr.cx("fr-hidden-md", "fr-mb-2w")}
        style={{ width: "100%" }}
      >
        <SearchFiltersSubMenu
          sortType={sortType}
          isSortAsc={isSortAsc}
          advanced={advanced}
          allSubsFilters={allSubsFilters}
          allAtcFilters={allAtcFilters}
          allIndicationsFilters={allIndicationsFilters}
          setAllSubsFilters={setAllSubsFilters}
          setAllAtcFilters={setAllAtcFilters}
          setAllIndicationsFilters={setAllIndicationsFilters}
          setSortType={setSortType}
          setIsSortAsc={setIsSortAsc}
          selectedFiltersCount={getSelectedFiltersCount()}
        />
      </div>
      <FiltersColumn
        className={[
          fr.cx("fr-hidden", "fr-unhidden-md", "fr-py-2w", "fr-pr-4w"),
        ].join(" ")}
      >
        <SearchFiltersContainer
          sortType={sortType}
          isSortAsc={isSortAsc}
          advanced={advanced}
          allSubsFilters={allSubsFilters}
          allAtcFilters={allAtcFilters}
          allIndicationsFilters={allIndicationsFilters}
          setAllSubsFilters={setAllSubsFilters}
          setAllAtcFilters={setAllAtcFilters}
          setAllIndicationsFilters={setAllIndicationsFilters}
          setSortType={setSortType}
          setIsSortAsc={setIsSortAsc}
        />
      </FiltersColumn>
      <ResultsContainer className={[fr.cx("fr-col-12")].join(" ")}>
        <SearchSortBlock
          sortType={sortType}
          isSortAsc={isSortAsc}
          advanced={advanced}
          onUpdateSortType={setSortType}
          onUpdateIsSortAsc={setIsSortAsc}
          className={fr.cx("fr-hidden", "fr-unhidden-md")}
        />
        {filteredResultsList && (
          <SearchResultsPagination
            resultsList={filteredResultsList}
            allSubsFilters={allSubsFilters}
            allAtcFilters={allAtcFilters}
            allIndicationsFilters={allIndicationsFilters}
          />
        )}
      </ResultsContainer>
    </SearchResultsListContainer>
  );
}

export default SearchResultsList;
