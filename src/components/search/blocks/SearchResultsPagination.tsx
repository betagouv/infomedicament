"use client";

import DataBlockSpecResult from "@/components/data/DataBlockSpecResult";
import DataListPagination from "@/components/data/DataListPagination";
import { SearchFilter, SearchResultItem } from "@/types/SearchTypes";
import { HTMLAttributes, useEffect, useState } from "react";

interface SearchResultsPaginationProps extends HTMLAttributes<HTMLDivElement> {
  resultsList: SearchResultItem[];
  allSubsFilters: SearchFilter[];
  allAtcFilters: SearchFilter[];
  allIndicationsFilters: SearchFilter[];
}

function SearchResultsPagination({
  resultsList,
  allSubsFilters,
  allAtcFilters,
  allIndicationsFilters
}: SearchResultsPaginationProps) {  
  
  const PAGINATION_LENGTH: number = 50;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentResultsList, setCurrentResultsList] = useState<SearchResultItem[]>([]);

  function getCurrentResultList(
    list: SearchResultItem[],
    currentPage: number,
  ){
    if(list && list.length > 0) {
      const newList = list.slice(
        (currentPage - 1) * PAGINATION_LENGTH,
        currentPage * PAGINATION_LENGTH,
      );
      return newList;
    }
    return [];
  }

  useEffect(() => {
    const list = getCurrentResultList(resultsList, currentPage);
    setCurrentResultsList(list);
  }, [resultsList, currentPage, setCurrentResultsList]);

  return currentResultsList && (
    <>
      {currentResultsList.map((result, index) => (
        <DataBlockSpecResult
          key={index}
          specialite={result}
          subsFilters={allSubsFilters.filter((filter) => filter.selected)}
          atcsFilters={allAtcFilters.filter((filter) => filter.selected)}
          indicationsFilters={allIndicationsFilters.filter((filter) => filter.selected)}
        />
      ))}
      <DataListPagination 
        dataLength={resultsList.length}
        paginationLength={PAGINATION_LENGTH}
        updateCurrentPage={setCurrentPage}
      />
    </>
  );
};

export default SearchResultsPagination;
