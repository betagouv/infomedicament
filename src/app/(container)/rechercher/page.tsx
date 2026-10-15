import { getSearchResults, getSynonymSuggestion } from "@/db/utils";
import SearchPage from "@/components/search/SearchPage";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import SearchResultsList from "@/components/search/SearchResultsList";
import RatingToaster from "@/components/rating/RatingToaster";
import { fr } from "@codegouvfr/react-dsfr";
import { Suspense } from "react";
import SearchResultsLoading from "@/components/search/SearchResultsLoading";

type SearchParams = { searchParams?: Promise<Record<string, string>> };

export default function Page(props: SearchParams) {
  return (
    <SearchPage
      searchInput={
        <Suspense fallback={<AutocompleteSearch inputName="s" />}>
          <SearchInput searchParams={props.searchParams} />
        </Suspense>
      }
    >
      <Suspense fallback={<SearchResultsLoading />}>
        <ResultsForQuery searchParams={props.searchParams} />
      </Suspense>
    </SearchPage>
  );
}

async function SearchInput({ searchParams }: SearchParams) {
  const params = await searchParams;
  return (
    <AutocompleteSearch
      key={params?.s || ""}
      inputName="s"
      initialValue={params?.s || undefined}
    />
  );
}

async function ResultsForQuery({
  searchParams: searchParamsPromise,
}: SearchParams) {
  const searchParams = await searchParamsPromise;
  const search = searchParams?.s;
  return (
    <Suspense
      key={search || ""}
      fallback={<SearchResultsLoading search={search} />}
    >
      <SearchResults search={search} />
    </Suspense>
  );
}

async function SearchResults({ search }: { search?: string }) {
  const [results, synonymTerms] = search
    ? await Promise.all([
        getSearchResults(search),
        getSynonymSuggestion(search),
      ])
    : [[], []];

  return (
    <>
      {synonymTerms.length > 0 && (
        <div className={fr.cx("fr-grid-row")}>
          <p
            className={fr.cx(
              "fr-col-12",
              "fr-col-lg-9",
              "fr-col-md-10",
              "fr-text--sm",
              "fr-mb-2w",
            )}
            style={{ color: "var(--text-mention-grey)" }}
          >
            Vouliez-vous dire : <strong>{synonymTerms.join(", ")}</strong> ?
          </p>
        </div>
      )}
      {results.length > 0 ? (
        <SearchResultsList resultsList={results} search={search || undefined} />
      ) : (
        <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            Il n’y a aucun résultat.
          </div>
        </div>
      )}
      <RatingToaster pageId={`Recherche ${search || ""}`} />
    </>
  );
}
