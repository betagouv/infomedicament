import { getSearchResults } from "@/db/utils";
import { getArticlesFromSearchResults } from "@/db/utils/articles";
import { getOpenSearchResults, getOpenSearchSectionResults } from "@/db/utils/searchOpenSearch";
import { detectQueryIntent, stripIntentFromQuery, stripSpecialiteFromQuery } from "@/db/utils/searchIntent";
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
    const intent = search ? detectQueryIntent(search) : null;
    const medicationQuery = search && intent ? stripIntentFromQuery(search, intent) : search;
    const sectionQuery = search && intent && medicationQuery ? stripSpecialiteFromQuery(search, medicationQuery) : search;
    const results = medicationQuery ? await getOpenSearchResults(medicationQuery) : [];
    const cisCodes = results.map((r) => r.cisCode);
    const sectionResults = sectionQuery
      ? await getOpenSearchSectionResults(sectionQuery, cisCodes, intent ?? undefined)
      : [];
    return (
      <>
        <SearchPageV2
          search={search ? search : undefined}
          filterPregnancy={filterPregnancy}
          filterPediatric={filterPediatric}
          searchResults={results}
          sectionResults={sectionResults}
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
