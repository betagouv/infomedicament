"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import type { SearchResultItem } from "@/types/SearchTypes";

type SearchPageProps = {
  search?: string;
  searchResults: SearchResultItem[];
};

export default function SearchPage({ search, searchResults }: SearchPageProps) {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-mt-4w", "fr-mb-3w")}>
        <AutocompleteSearch inputName="s" initialValue={search} />
      </div>

      {searchResults.length > 0 ? (
        <SearchResultsList resultsList={searchResults} search={search} />
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
