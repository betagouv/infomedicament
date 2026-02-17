import { getSearchResults } from "@/db/utils";
import { getArticlesFromSearchResults } from "@/db/utils/articles";
import SearchPage from "./SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const results = search ? await getSearchResults(searchParams["s"]) : [];
  const articlesList = results.length > 0
    ? await getArticlesFromSearchResults(results)
    : [];
  const filterPregnancy: boolean = (searchParams && "g" in searchParams && searchParams["g"] === "true") ? true : false;
  const filterPediatric: boolean = (searchParams && "p" in searchParams && searchParams["p"] === "true") ? true : false;

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
