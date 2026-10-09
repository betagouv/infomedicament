import { getSearchResults, getSynonymSuggestion } from "@/db/utils";
import { getArticlesFromSearchResults } from "@/db/utils/articles";
import SearchPage from "@/components/search/SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";

export default function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <SearchResults searchParams={props.searchParams} />
    </Suspense>
  );
}

async function SearchResults({
  searchParams: searchParamsPromise,
}: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await searchParamsPromise;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const [results, synonymTerms] = search
    ? await Promise.all([
        getSearchResults(searchParams["s"]),
        getSynonymSuggestion(searchParams["s"]),
      ])
    : [[], []];
  // const articlesList = results.length > 0
  //   ? await getArticlesFromSearchResults(results)
  //   : [];
  const articlesList: ArticleCardResume[] = [];

  return (
    <>
      <SearchPage
        search={search ? search : undefined}
        searchResults={results}
        synonymTerms={synonymTerms}
        articlesList={articlesList}
      />
      <RatingToaster pageId={`Recherche ${search ? search : ""}`} />
    </>
  );
}
