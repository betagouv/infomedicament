import { fr } from "@codegouvfr/react-dsfr";
;
import { getSearchResults, getSpecialite } from "@/db/utils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { ExtendedSearchResultItem, MainFilterCounterType, MainFilterTypeEnum } from "@/types/SearchType";
import { getAtc2, getAtcCode } from "@/data/grist/atc";
import { SearchResultItem } from "@/db/utils/search";

type ExtendedResults = { 
  counters: MainFilterCounterType, 
  results: ExtendedSearchResultItem[],
};

async function getExtendedResults(results: SearchResultItem[]): Promise<ExtendedResults> {
  const counters: MainFilterCounterType = {
    [MainFilterTypeEnum.ALL]: 0,
    [MainFilterTypeEnum.MEDGROUP]: 0,
    [MainFilterTypeEnum.SUBSTANCE]: 0,
    [MainFilterTypeEnum.PATHOLOGY]: 0,
    [MainFilterTypeEnum.ATCCLASS]: 0,
  }
  const extendedResults = await Promise.all(
    results.map(async (result: SearchResultItem) => {
      counters[MainFilterTypeEnum.ALL] ++;
      if("NomLib" in result) {
        //Substance
        counters[MainFilterTypeEnum.SUBSTANCE] ++;
        return {
          filterType: MainFilterTypeEnum.SUBSTANCE,
          data: result,
        }
      } else if("groupName" in result){
        //Med Group
        counters[MainFilterTypeEnum.MEDGROUP] ++;
        const atc = getAtcCode(result.specialites[0].SpecId);
        const { composants } = await getSpecialite(result.specialites[0].SpecId);
        return {
          filterType: MainFilterTypeEnum.MEDGROUP,
          data : {
            atc2: await getAtc2(atc),
            composants: composants,
            ...result,
          }
        }
      } else if("NomPatho" in result) {
        //Pathology
        counters[MainFilterTypeEnum.PATHOLOGY] ++;
        return {
          filterType: MainFilterTypeEnum.PATHOLOGY,
          data: result,
        }
      } else {
        //ATC Class
        counters[MainFilterTypeEnum.ATCCLASS] ++;
        return {
          filterType: MainFilterTypeEnum.ATCCLASS,
          data: result,
        }
      }
    })
  );
  return {
    counters,
    results: extendedResults,
  };
}

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const results = search && (await getSearchResults(searchParams["s"]));
  const extendedResults = results && (await getExtendedResults(results));

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
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
      {extendedResults ? (
        <SearchResultsList resultsList={extendedResults.results} counters={extendedResults.counters} searchTerms={search}/>
      ) : (
        <>Il n’y a aucun résultat.</>
      )}
    </ContentContainer>
  );
}
