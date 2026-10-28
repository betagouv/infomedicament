"use client";

import DataBlockSpecResult from "@/components/data/DataBlockSpecResult";
import DataListPagination from "@/components/data/DataListPagination";
import { SearchFilter, SearchResultItem } from "@/types/SearchTypes";
import { HTMLAttributes, useCallback, useState } from "react";

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
  allIndicationsFilters,
}: SearchResultsPaginationProps) {
  const PAGINATION_LENGTH: number = 50;
  const [pagination, setPagination] = useState({ list: resultsList, page: 1 });
  const currentPage = pagination.list === resultsList ? pagination.page : 1;
  const updateCurrentPage = useCallback(
    (page: number) => {
      setPagination({ list: resultsList, page });
    },
    [resultsList],
  );
  const currentResultsList = resultsList.slice(
    (currentPage - 1) * PAGINATION_LENGTH,
    currentPage * PAGINATION_LENGTH,
  );

  return (
    currentResultsList && (
      <>
        {currentResultsList.map((result, index) => (
          <DataBlockSpecResult
            key={index}
            specialite={result}
            subsFilters={allSubsFilters.filter((filter) => filter.selected)}
            atcsFilters={allAtcFilters.filter((filter) => filter.selected)}
            indicationsFilters={allIndicationsFilters.filter(
              (filter) => filter.selected,
            )}
          />
        ))}
        <DataListPagination
          dataLength={resultsList.length}
          paginationLength={PAGINATION_LENGTH}
          updateCurrentPage={updateCurrentPage}
        />
      </>
    )
  );
}

export default SearchResultsPagination;
