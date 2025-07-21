"use client";
import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Pagination from "@codegouvfr/react-dsfr/Pagination";

interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  dataLength: number;
  paginationLength: number;
  updateCurrentPage: (page: number) => void;
}

function DataListPagination({
  dataLength,
  paginationLength,
  updateCurrentPage,
}: DataListProps) {

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentPageCount, setCurrentPageCount] = useState<number>(1);

  useEffect(() => {
    if(paginationLength > 0){ 
      const pageCount =
        Math.trunc(dataLength / paginationLength) +
        (dataLength % paginationLength ? 1 : 0);
      setCurrentPageCount(pageCount);
    } else {
      setCurrentPageCount(1);
    }
  }, [dataLength, paginationLength, setCurrentPageCount]);

  function onPaginationChange(pageNumber:number) {
    let newPage = 1;
    if(paginationLength > 0){ 
      newPage = pageNumber;
    }
    setCurrentPage(newPage);
    updateCurrentPage(newPage);
  }
  
  return (
    <>
      {currentPageCount > 1 && (
        <div className={fr.cx("fr-col-12")}>
          <Pagination
            className={fr.cx("fr-mt-1w")}
            count={currentPageCount}
            defaultPage={currentPage}
            getPageLinkProps={(page: number) => ({
              onClick: () => onPaginationChange(page),
              href: '#',
            })}
          />
        </div>
      )}
    </>
  );
};

export default DataListPagination;
