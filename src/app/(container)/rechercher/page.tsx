import { getArticlesFromSearchResults } from "@/db/utils/articles";
import SearchPage from "@/components/search/SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { getSearchResults } from "@/db/utils/search";
import { getSynonymSuggestion } from "@/db/utils/searchSynonyms";

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
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
      <RatingToaster
        pageId={`Recherche ${search ? search : ""}`}
      />
    </>
  );
}
