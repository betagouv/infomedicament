import SearchPage from "@/components/search/SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSmartSearchResponse } from "./smartSearch";

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const selectedSpecId = searchParams && "selectedSpecId" in searchParams
    ? searchParams["selectedSpecId"]
    : undefined;
  const smartSearch = search
    ? await getSmartSearchResponse(search, selectedSpecId)
    : undefined;

  return (
    <>
      <SearchPage
        search={search || undefined}
        searchResults={smartSearch?.searchResults ?? []}
        smartSearch={smartSearch}
      />
      <RatingToaster
        pageId={`Recherche ${search || ""}`}
      />
    </>
  );
}
