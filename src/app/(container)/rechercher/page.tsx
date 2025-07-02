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
import { AdvancedData, AdvancedPatho, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";

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
  results.forEach((result) => {
    counter ++;
    if("NomLib" in result) {
      //Substance
      extentedOrderedResults[DataTypeEnum.SUBSTANCE].push({
        type: DataTypeEnum.SUBSTANCE,
        result: {
          nbSpecs: 0,
          ...result
        }
      });
    } else if("groupName" in result){
      //Med Group
      extentedOrderedResults[DataTypeEnum.MEDGROUP].push({
        type: DataTypeEnum.MEDGROUP,
        result: {
          composants: [],
          ...result
        }
      });
    } else if("NomPatho" in result) {
      //Pathology
      extentedOrderedResults[DataTypeEnum.PATHOLOGY].push({
        type: DataTypeEnum.PATHOLOGY,
        result: {
          nbSpecs: 0,
          ...result
        }
      });
    } else {
      //ATC Class
      extentedOrderedResults[DataTypeEnum.ATCCLASS].push({
        type: DataTypeEnum.ATCCLASS,
        result: result,
      });
    }
  })

  const pregnancyAlerts = await getPregnancyAlerts();

  await extentedOrderedResults[DataTypeEnum.SUBSTANCE].map(async(result: AdvancedData) => {
    const specialites = await getSubstanceSpecialites((result.result as AdvancedSubstanceNom).NomId);
    const specialitiesGroups = await groupSpecialites(specialites);
    (result.result as AdvancedSubstanceNom).nbSpecs = specialitiesGroups.length;
  });
  await extentedOrderedResults[DataTypeEnum.MEDGROUP].map(async(result: AdvancedData) => {
    const advancedMedicamentGroup = await getAdvancedMedicamentGroupFromGroupNameSpecialites(
      (result.result as AdvancedMedicamentGroup).groupName, 
      (result.result as AdvancedMedicamentGroup).specialites, 
      pregnancyAlerts
    );
    (result.result as AdvancedMedicamentGroup).atc1 = advancedMedicamentGroup.atc1;
    (result.result as AdvancedMedicamentGroup).atc2 = advancedMedicamentGroup.atc2;
    (result.result as AdvancedMedicamentGroup).composants = advancedMedicamentGroup.composants;
    (result.result as AdvancedMedicamentGroup).pregnancyAlert = advancedMedicamentGroup.pregnancyAlert;
    (result.result as AdvancedMedicamentGroup).pediatrics = advancedMedicamentGroup.pediatrics;
  });
  await extentedOrderedResults[DataTypeEnum.PATHOLOGY].map(async(result: AdvancedData) => {
    const specialites = await getPathoSpecialites((result.result as AdvancedPatho).codePatho);
    (result.result as AdvancedPatho).nbSpecs = specialites.length;

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
  console.log("results");
  results && results.forEach((res) => {
    if("groupName" in res){
      console.log(res.groupName);
    }
  })
  const extendedResults = results && (await getExtendedOrderedResults(results));
  console.log("extendedResults");
 ( extendedResults && extendedResults.results && extendedResults.results["Médicament"]) && extendedResults.results["Médicament"].forEach((res) => {
    console.log((res.result as AdvancedMedicamentGroup).groupName);
  })
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
