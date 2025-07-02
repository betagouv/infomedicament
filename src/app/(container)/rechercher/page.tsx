import { fr } from "@codegouvfr/react-dsfr";
;
import { getSearchResults, groupSpecialites } from "@/db/utils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { ExtendedSearchResults } from "@/types/SearchTypes";
import { getPathoSpecialites, getSubstanceSpecialites, SearchResultItem } from "@/db/utils/search";
import { getPregnancyAlerts } from "@/data/grist/pregnancy";
import { getAdvancedMedicamentGroupFromGroupNameSpecialites } from "@/db/utils/medicaments";
import { getArticlesFromSearchResults } from "@/data/grist/articles";
import { DataTypeEnum } from "@/types/DataTypes";

type ExtendedOrderResults = { 
  counter: number,
  results: ExtendedSearchResults,
};

async function getExtendedOrderedResults(results: SearchResultItem[]): Promise<ExtendedOrderResults> {
  let counter = 0;
  const extentedOrderedResults: ExtendedSearchResults = {
    [DataTypeEnum.MEDGROUP]: [],
    [DataTypeEnum.SUBSTANCE]: [],
    [DataTypeEnum.PATHOLOGY]: [],
    [DataTypeEnum.ATCCLASS]: [],
  }

  const pregnancyAlerts = await getPregnancyAlerts();  
  const extendedResults = await Promise.all(
    results.map(async (result: SearchResultItem) => {
      counter ++;
      if("NomLib" in result) {
        //Substance
        const specialites = await getSubstanceSpecialites(result.NomId);
        const specialitiesGroups = await groupSpecialites(specialites);
        return {
          type: DataTypeEnum.SUBSTANCE,
          result: {
            nbSpecs: specialitiesGroups.length,
            ...result
          }
        };
      } else if("groupName" in result){
        //Med Group
        const advancedMedicamentGroup = await getAdvancedMedicamentGroupFromGroupNameSpecialites(result.groupName, result.specialites, pregnancyAlerts);
        return {
          type: DataTypeEnum.MEDGROUP,
          result: advancedMedicamentGroup
        };
      } else if("NomPatho" in result) {
        //Pathology
        const specialites = await getPathoSpecialites(result.codePatho);
        return {
          type: DataTypeEnum.PATHOLOGY,
          result: {
            nbSpecs: specialites.length,
            ...result
          }
        };
      } else {
        //ATC Class
        return {
          type: DataTypeEnum.ATCCLASS,
          result: result,
        }
      }
    })
  );
  extendedResults.forEach((result) => {
    extentedOrderedResults[result.type].push(result);
  }); 

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
  const articlesList = extendedResults 
    ? (await getArticlesFromSearchResults(extendedResults.results))
    : [];
  const filterPregnancy:boolean = (searchParams && "g" in searchParams && searchParams["g"] === "true") ? true : false; 
  const filterPediatric:boolean = (searchParams && "p" in searchParams && searchParams["p"] === "true") ? true : false; 

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <form
            action="/rechercher"
            className={fr.cx("fr-mt-4w", "fr-mb-1w")}
          >
            <AutocompleteSearch
              inputName="s"
              initialValue={search || undefined}
              hideFilters
            />
          </form>
        </div>
      </div>
      {extendedResults && extendedResults.counter > 0 ? (
        <SearchResultsList 
          resultsList={extendedResults.results} 
          totalResults={extendedResults.counter} 
          searchTerms={search} 
          articles={articlesList}
          filterPregnancy={filterPregnancy}
          filterPediatric={filterPediatric}
        />
      ) : (
        <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            Il n’y a aucun résultat.
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
