import { getSearchResults } from "@/db/utils";
import { getArticlesFromSearchResults } from "@/db/utils/articles";
import { getOpenSearchResults } from "@/db/utils/searchOpenSearch";
import SearchPage from "./SearchPage";
import SearchPageV2 from "./SearchPageV2";
import RatingToaster from "@/components/rating/RatingToaster";

const useExperimentalSearch = process.env.USE_EXPERIMENTAL_SEARCH === "true";

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const filterPregnancy: boolean = (searchParams && "g" in searchParams && searchParams["g"] === "true") ? true : false;
  const filterPediatric: boolean = (searchParams && "p" in searchParams && searchParams["p"] === "true") ? true : false;

  if (useExperimentalSearch) {
    const results = search ? await getOpenSearchResults(searchParams["s"]) : [];
    return (
      <>
        <SearchPageV2
          search={search ? search : undefined}
          filterPregnancy={filterPregnancy}
          filterPediatric={filterPediatric}
          searchResults={results}
        />
        <RatingToaster pageId={`Recherche ${search ? search : ""}`} />
      </>
    );
  }

  const results = search ? await getSearchResults(searchParams["s"]) : [];
  const articlesList = results.length > 0
    ? await getArticlesFromSearchResults(results)
    : [];

  return (
    <>
      <SearchPage
        search={search ? search : undefined}
        filterPregnancy={filterPregnancy}
        filterPediatric={filterPediatric}
        searchResults={results}
        articlesList={articlesList}
      />
      <RatingToaster
        pageId={`Recherche ${search ? search : ""}`}
      />
    </>
  );
}
