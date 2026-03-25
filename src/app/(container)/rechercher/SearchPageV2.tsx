"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsListV2 from "@/components/search/SearchResultsListV2";
import { HTMLAttributes, useEffect, useState } from "react";
import { SearchResultItemV2 } from "@/db/utils/searchOpenSearch";

interface SearchPageV2Props extends HTMLAttributes<HTMLDivElement> {
  search?: string;
  filterPregnancy?: boolean;
  filterPediatric?: boolean;
  searchResults?: SearchResultItemV2[];
}

function SearchPageV2({
  search,
  filterPregnancy,
  filterPediatric,
  searchResults,
}: SearchPageV2Props) {
  const [currentFilterPregnancy, setCurrentFilterPregnancy] = useState<boolean>(false);
  const [currentFilterPediatric, setCurrentFilterPediatric] = useState<boolean>(false);

  useEffect(() => {
    setCurrentFilterPregnancy(filterPregnancy ?? false);
  }, [filterPregnancy]);

  useEffect(() => {
    setCurrentFilterPediatric(filterPediatric ?? false);
  }, [filterPediatric]);

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mt-4w")}>
          <AutocompleteSearch
            inputName="s"
            initialValue={search || undefined}
            hideFilters
            filterPediatric={currentFilterPediatric}
            filterPregnancy={currentFilterPregnancy}
          />
        </div>
      </div>
      {searchResults && searchResults.length > 0 ? (
        <SearchResultsListV2
          resultsList={searchResults}
          totalResults={searchResults.length}
          searchTerms={search}
          setFilterPregnancy={setCurrentFilterPregnancy}
          setFilterPediatric={setCurrentFilterPediatric}
          filterPregnancy={currentFilterPregnancy}
          filterPediatric={currentFilterPediatric}
        />
      ) : (
        <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            Il n&apos;y a aucun résultat.
          </div>
        </div>
      )}
    </ContentContainer>
  );
}

export default SearchPageV2;
