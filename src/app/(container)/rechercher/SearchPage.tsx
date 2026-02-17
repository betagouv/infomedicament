"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { HTMLAttributes, useEffect, useState } from "react";
import { SearchResultItem } from "@/db/utils/search";
import { ArticleCardResume } from "@/types/ArticlesTypes";

interface SearchPageProps extends HTMLAttributes<HTMLDivElement> {
  search?: string;
  filterPregnancy?: boolean;
  filterPediatric?: boolean;
  searchResults?: SearchResultItem[];
  articlesList?: ArticleCardResume[];
}

function SearchPage({
  search,
  filterPregnancy,
  filterPediatric,
  searchResults,
  articlesList
}: SearchPageProps) {


  const [currentFilterPregnancy, setCurrentFilterPregnancy] = useState<boolean>(false);
  const [currentFilterPediatric, setCurrentFilterPediatric] = useState<boolean>(false); 

  useEffect(() => {
    if(filterPregnancy)
      setCurrentFilterPregnancy(filterPregnancy);
    else setCurrentFilterPregnancy(false);
  }, [filterPregnancy, setCurrentFilterPregnancy])

  useEffect(() => {
    if(filterPediatric)
      setCurrentFilterPediatric(filterPediatric);
    else setCurrentFilterPediatric(false);
  }, [filterPediatric, setCurrentFilterPediatric])


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
        <SearchResultsList
          resultsList={searchResults}
          totalResults={searchResults.length}
          searchTerms={search}
          articles={articlesList}
          setFilterPregnancy={setCurrentFilterPregnancy}
          setFilterPediatric={setCurrentFilterPediatric}
          filterPregnancy={currentFilterPregnancy}
          filterPediatric={currentFilterPediatric}
        />
      ) : (
        <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            Il n’y a aucun résultat.
          </div>
        </div>
      )}
    </ContentContainer>
  );
}

export default SearchPage;