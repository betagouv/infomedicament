"use client";

import { fr } from "@codegouvfr/react-dsfr";
import styled from "styled-components";
import Alert from "@codegouvfr/react-dsfr/Alert";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import AdvancedSearchPanel from "@/components/search/AdvancedSearchPanel";
import { HTMLAttributes, ReactNode, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  advancedSearchParams,
  type AdvancedSearchCriteria,
  MAX_ADVANCED_SEARCH_RESULTS,
} from "@/utils/advancedSearch";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { SearchResultItem } from "@/types/SearchTypes";

const SynonymSuggestion = styled.p`
  color: var(--text-mention-grey);
`;

interface SearchPageProps extends HTMLAttributes<HTMLDivElement> {
  searchInput?: ReactNode;
  search?: string;
  searchResults?: SearchResultItem[];
  synonymTerms?: string[];
  articlesList?: ArticleCardResume[];
  advancedCriteria?: AdvancedSearchCriteria;
  searchError?: string;
  //For now we are not displaying articles but we keep it in the process
}

function SearchPage({
  search,
  searchInput,
  children,
  advancedCriteria,
  searchError,
}: SearchPageProps) {
  const router = useRouter();
  const [isSearching, startSearch] = useTransition();
  const navigate = (
    query: string,
    criteria?: AdvancedSearchCriteria | null,
    submitted = false,
  ) => {
    const params = advancedSearchParams(query, criteria);
    if (criteria && submitted) params.set("submitted", "1");
    startSearch(() => router.push(`/rechercher?${params}`));
  };
  return (
    <ContentContainer frContainer aria-busy={isSearching}>
      {!advancedCriteria && (
        <div className={fr.cx("fr-grid-row")}>
          <div
            className={fr.cx(
              "fr-col-12",
              "fr-col-lg-9",
              "fr-col-md-10",
              "fr-mt-4w",
              "fr-mb-0",
            )}
          >
            {searchInput ?? (
              <AutocompleteSearch
                inputName="s"
                initialValue={search || undefined}
                onSearch={(query) => navigate(query)}
              />
            )}
          </div>
        </div>
      )}
      <AdvancedSearchPanel
        initialCriteria={advancedCriteria}
        onSearch={(criteria, submitted) => navigate("", criteria, submitted)}
        isSearching={isSearching}
      />
      {isSearching && <p role="status">Recherche en cours…</p>}
      {searchError && (
        <p role="alert" className={fr.cx("fr-error-text")}>
          {searchError}
        </p>
      )}
      {children}
    </ContentContainer>
  );
}

export function SearchResultsContent({
  search,
  searchResults,
  synonymTerms,
  advancedCriteria,
  searchError,
}: SearchPageProps) {
  return (
    <>
      {advancedCriteria &&
        searchResults &&
        searchResults.length >= MAX_ADVANCED_SEARCH_RESULTS && (
          <p className={fr.cx("fr-text--sm")} role="status">
            Affichage limité aux {MAX_ADVANCED_SEARCH_RESULTS} premières
            spécialités, par ordre alphabétique. Affinez vos critères pour
            réduire le nombre de résultats.
          </p>
        )}
      {synonymTerms && synonymTerms.length > 0 && (
        <div className={fr.cx("fr-grid-row")}>
          <SynonymSuggestion
            className={fr.cx(
              "fr-col-12",
              "fr-col-lg-9",
              "fr-col-md-10",
              "fr-text--sm",
              "fr-mb-2w",
            )}
          >
            Vouliez-vous dire : <strong>{synonymTerms.join(", ")}</strong> ?
          </SynonymSuggestion>
        </div>
      )}
      {!searchError &&
        searchResults &&
        (searchResults.length > 0 ? (
          <SearchResultsList
            advanced={Boolean(advancedCriteria)}
            resultsList={searchResults}
            search={advancedCriteria ? undefined : search}
          />
        ) : (
          <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
            <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
              <Alert
                severity="info"
                title="Aucun résultat"
                description={
                  advancedCriteria
                    ? "Aucune spécialité ne correspond à ces critères. Essayez d’en modifier ou d’en retirer certains."
                    : "Aucun médicament ne correspond à votre recherche. Vérifiez l’orthographe ou essayez un autre terme."
                }
              />
            </div>
          </div>
        ))}
    </>
  );
}

export default SearchPage;
