import { fr } from "@codegouvfr/react-dsfr";
;
import { getSearchResults, getSpecialite } from "@/db/utils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { ExtendedSearchResults, SearchTypeEnum } from "@/types/SearchType";
import { getAtc1, getAtc2, getAtcCode } from "@/data/grist/atc";
import { SearchResultItem } from "@/db/utils/search";

type ExtendedOrderResults = { 
  counter: number,
  results: ExtendedSearchResults,
};

//TODO clean empty ?
async function getExtendedOrderedResults(results: SearchResultItem[]): Promise<ExtendedOrderResults> {
  let counter = 0;
  const extentedOrderedResults: ExtendedSearchResults = {
    [SearchTypeEnum.MEDGROUP]: [],
    [SearchTypeEnum.SUBSTANCE]: [],
    [SearchTypeEnum.PATHOLOGY]: [],
    [SearchTypeEnum.ATCCLASS]: [],
  }
  await Promise.all(
    results.map(async (result: SearchResultItem) => {
      counter ++;
      if("NomLib" in result) {
        //Substance
        /*  const specialites: Specialite[] = await pdbmMySQL
            .selectFrom("Specialite")
            .selectAll("Specialite")
            .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
            .where("Specialite.SpecId", "in", liste_CIS_MVP)
            .groupBy("Specialite.SpecId")
            .execute(); */
        extentedOrderedResults[SearchTypeEnum.SUBSTANCE].push(result);
      } else if("groupName" in result){
        //Med Group
        const atc = getAtcCode(result.specialites[0].SpecId);
        const { composants } = await getSpecialite(result.specialites[0].SpecId);
        extentedOrderedResults[SearchTypeEnum.MEDGROUP].push({
          atc1: await getAtc1(atc),
          atc2: await getAtc2(atc),
          composants: composants,
          ...result,
        });
      } else if("NomPatho" in result) {
        //Pathology
        extentedOrderedResults[SearchTypeEnum.PATHOLOGY].push(result);
      } else {
        //ATC Class
        extentedOrderedResults[SearchTypeEnum.PATHOLOGY].push(result);
      }
    })
  );
  return {
    counter,
    results: extentedOrderedResults
  };
}

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const results = search && (await getSearchResults(searchParams["s"]));
  const extendedResults = results && (await getExtendedOrderedResults(results));

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row", "fr-mb-4w")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <form
            action="/rechercher"
            className={fr.cx("fr-my-4w")}
          >
            <AutocompleteSearch
              inputName="s"
              initialValue={search || undefined}
            />
          </form>
        </div>
      </div>
      {extendedResults && extendedResults.counter > 0 ? (
        <SearchResultsList resultsList={extendedResults.results} totalResults={extendedResults.counter} searchTerms={search}/>
      ) : (
        <>Il n’y a aucun résultat.</>
      )}
    </ContentContainer>
  );
}
