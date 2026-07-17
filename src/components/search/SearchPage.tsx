"use client";

import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import type { SearchResultItem } from "@/types/SearchTypes";

type SearchPageProps = {
  search?: string;
  searchResults: SearchResultItem[];
  synonymTerms: string[];
};

export default function SearchPage({ search, searchResults, synonymTerms }: SearchPageProps) {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-mt-4w", "fr-mb-3w")}>
        <AutocompleteSearch inputName="s" initialValue={search} />
      </div>

      {synonymTerms.length > 0 && (
        <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
          Vouliez-vous dire : <strong>{synonymTerms.join(", ")}</strong> ?
        </p>
      )}

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
