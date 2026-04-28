"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { HTMLAttributes } from "react";
import { SearchResultItem } from "@/db/utils/search";
import { ArticleCardResume } from "@/types/ArticlesTypes";

interface SearchPageProps extends HTMLAttributes<HTMLDivElement> {
  search?: string;
  searchResults?: SearchResultItem[];
  articlesList?: ArticleCardResume[];
  //For now we are not displaying articles but we keep it in the process
}

function SearchPage({
  search,
  searchResults,
  articlesList
}: SearchPageProps) {

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mt-4w", "fr-mb-2w")}>
          <AutocompleteSearch
            inputName="s"
            initialValue={search || undefined}
          />
        </div>
      </div>
      {searchResults && searchResults.length > 0 ? (
        <SearchResultsList
          resultsList={searchResults}
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