import SearchPage from "@/components/search/SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSearchResults, getSynonymSuggestion } from "@/db/utils";

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const [searchResults, synonymTerms] = search
    ? await Promise.all([
        getSearchResults(search),
        getSynonymSuggestion(search),
      ])
    : [[], []];

  return (
    <>
      <SearchPage
        search={search || undefined}
        searchResults={searchResults}
        synonymTerms={synonymTerms}
      />
      <RatingToaster
        pageId={`Recherche ${search || ""}`}
      />
    </>
  );
}
