import { fr } from "@codegouvfr/react-dsfr";
;
import { getSearchResults, getSpecialite } from "@/db/utils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { ExtendedSearchResultItem, MainFilterTypeEnum } from "@/types/SearchType";
import { getAtc2, getAtcCode } from "@/data/grist/atc";
import { SearchResultItem } from "@/db/utils/search";

async function getExtendedResults(results: SearchResultItem[]): Promise<ExtendedSearchResultItem[]> {
  const extendedResults = Promise.all(
    results.map(async (result: SearchResultItem) => {
      if("NomLib" in result) {
        //Substance
        return {
          filterType: MainFilterTypeEnum.SUBSTANCE,
          data: result,
        }
      } else if("groupName" in result){
        //Med Group
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
        return {
          filterType: MainFilterTypeEnum.PATHOLOGY,
          data: result,
        }
      } else {
        //ATC Class
        return {
          filterType: MainFilterTypeEnum.ATCCLASS,
          data: result,
        }
      }
    })
  );
  return extendedResults;
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
        <SearchResultsList resultsList={extendedResults} searchTerms={search}/>
      ) : (
        <>Il n’y a aucun résultat.</>
      )}
    </ContentContainer>
  );
}
