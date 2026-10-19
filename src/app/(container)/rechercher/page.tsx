import { getSearchResults, getSynonymSuggestion } from "@/db/utils";
import { getCachedAdvancedSearchResults } from "@/db/utils/advancedSearch";
import SearchPage, {
  SearchResultsContent,
} from "@/components/search/SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import SearchResultsLoading from "@/components/search/SearchResultsLoading";
import {
  advancedSearchParams,
  parseAdvancedSearch,
  hasAdvancedSearchRequest,
  getAdvancedSearchDraft,
  type AdvancedSearchCriteria,
} from "@/utils/advancedSearch";
import { Suspense } from "react";
import { Metadata } from "next";

export async function generateMetadata(props: {
  searchParams?: Promise<Record<string, string | string[]>>;
}): Promise<Metadata> {
  // Result pages (any query param) are not indexed, but their links are followed.
  const hasQuery = Object.keys((await props.searchParams) ?? {}).length > 0;
  return {
    title: "Recherche",
    description: "Recherchez un médicament par nom, substance active et / ou indication et accédez à sa notice, son RCP et ses informations.",
    ...(hasQuery && { robots: { index: false, follow: true } }),
  };
}

export default function Page(props: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  return (
    <Suspense
      fallback={
        <SearchPage searchInput={<AutocompleteSearch inputName="s" />}>
          <SearchResultsLoading />
        </SearchPage>
      }
    >
      <SearchResults searchParams={props.searchParams} />
    </Suspense>
  );
}

async function SearchResults(props: {
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  const searchParams = new URLSearchParams();
  Object.entries((await props.searchParams) ?? {}).forEach(([key, value]) => {
    (Array.isArray(value) ? value : [value]).forEach((item) =>
      searchParams.append(key, item),
    );
  });
  let search = searchParams.get("s")?.trim() ?? "";
  let advancedCriteria;
  try {
    advancedCriteria = parseAdvancedSearch(searchParams);
    // Advanced UI searches use only the visible criteria, including legacy URLs with s.
    if (advancedCriteria) search = "";
    if (search.length > 200)
      throw new Error("La recherche est limitée à 200 caractères.");
  } catch (error) {
    const draft = getAdvancedSearchDraft(searchParams);
    return (
      <SearchPage
        key={searchParams.toString()}
        search={draft ? undefined : search}
        advancedCriteria={draft}
        searchError={(error as Error).message}
      />
    );
  }
  const hasSearchRequest = advancedCriteria
    ? hasAdvancedSearchRequest(searchParams, advancedCriteria)
    : Boolean(search);
  return (
    <SearchPage
      key={`${advancedSearchParams(search, advancedCriteria)}:${hasSearchRequest}`}
      advancedCriteria={advancedCriteria}
      search={search || undefined}
      searchInput={
        <AutocompleteSearch inputName="s" initialValue={search || undefined} />
      }
    >
      <Suspense
        key={searchParams.toString()}
        fallback={<SearchResultsLoading search={search || undefined} />}
      >
        <Results
          search={search}
          advancedCriteria={advancedCriteria}
          hasSearchRequest={hasSearchRequest}
        />
      </Suspense>
    </SearchPage>
  );
}

async function Results({
  search,
  advancedCriteria,
  hasSearchRequest,
}: {
  search: string;
  advancedCriteria?: AdvancedSearchCriteria;
  hasSearchRequest: boolean;
}) {
  const [results, synonymTerms] = hasSearchRequest
    ? await Promise.all([
        advancedCriteria
          ? getCachedAdvancedSearchResults(search, advancedCriteria)
          : getSearchResults(search),
        search && !advancedCriteria
          ? getSynonymSuggestion(search)
          : Promise.resolve([]),
      ])
    : [[], []];

  return (
    <>
      <SearchResultsContent
        advancedCriteria={advancedCriteria}
        search={search ? search : undefined}
        searchResults={hasSearchRequest ? results : undefined}
        synonymTerms={synonymTerms}
      />
      <RatingToaster pageId={`Recherche ${search ? search : ""}`} />
    </>
  );
}
