import QuestionPage from "@/components/search/QuestionPage";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSmartSearchResponse } from "./smartSearch";

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.q;
  const selectedSpecId = searchParams?.selectedSpecId;
  const smartSearch = query
    ? await getSmartSearchResponse(query, selectedSpecId)
    : undefined;

  return (
    <>
      <QuestionPage query={query} smartSearch={smartSearch} />
      <RatingToaster pageId={`Question ${query || ""}`} />
    </>
  );
}
