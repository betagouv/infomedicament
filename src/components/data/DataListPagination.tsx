"use client";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Pagination from "@codegouvfr/react-dsfr/Pagination";

interface DataListProps extends HTMLAttributes<HTMLDivElement> {
  dataLength: number;
  paginationLength: number;
  currentPage: number;
  updateCurrentPage: (page: number) => void;
}

function DataListPagination({
  dataLength,
  paginationLength,
  currentPage,
  updateCurrentPage,
}: DataListProps) {

  const currentPageCount = paginationLength > 0
    ? Math.ceil(dataLength / paginationLength)
    : 1;

  return currentPageCount > 1 && (
    <div className={fr.cx("fr-col-12")}>
      <Pagination
        className={fr.cx("fr-mt-1w")}
        count={currentPageCount}
        defaultPage={currentPage}
        getPageLinkProps={(page: number) => ({
          onClick: () => updateCurrentPage(page),
          href: '#',
        })}
      />
    </div>
  );
};

export default DataListPagination;
