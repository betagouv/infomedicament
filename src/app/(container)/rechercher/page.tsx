import { getSearchResults } from "@/db/utils";
import { ExtendedOrderResults, ExtendedSearchResults } from "@/types/SearchTypes";
import { SearchResultItem } from "@/db/utils/search";
import { getPregnancyPlanAlerts } from "@/data/grist/pregnancy";
import { getAdvancedMedicamentGroupFromGroupNameSpecialites } from "@/db/utils/medicaments";
import { getArticlesFromSearchResults } from "@/data/grist/articles";
import { AdvancedATC, DataTypeEnum } from "@/types/DataTypes";
import { getPathoSpecialites } from "@/db/utils/pathologies";
import SearchPage from "./SearchPage";
import RatingToaster from "@/components/rating/RatingToaster";
import { MedicamentGroup } from "@/displayUtils";
import { groupSpecialites } from "@/utils/specialites";
import { getSubstancesByAtc } from "@/db/utils/atc";
import { getSubstanceSpecialites } from "@/db/utils/specialities";

async function getExtendedOrderedResults(results: SearchResultItem[]): Promise<ExtendedOrderResults> {
  let counter = 0;
  const extentedOrderedResults: ExtendedSearchResults = {
    [DataTypeEnum.MEDGROUP]: [],
    [DataTypeEnum.SUBSTANCE]: [],
    [DataTypeEnum.PATHOLOGY]: [],
    [DataTypeEnum.ATCCLASS]: [],
  }

  const pregnancyPlanAlerts = await getPregnancyPlanAlerts();
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
            medicaments: specialitiesGroups.map((spec: MedicamentGroup) => spec[0]).length,
            ...result
          }
        };
      } else if("groupName" in result){
        //Med Group
        const advancedMedicamentGroup = await getAdvancedMedicamentGroupFromGroupNameSpecialites(result.groupName, result.specialites, pregnancyPlanAlerts);
        return {
          type: DataTypeEnum.MEDGROUP,
          result: advancedMedicamentGroup
        };
      } else if("NomPatho" in result) {
        //Pathology
        const specialites = await getPathoSpecialites(result.codePatho);
        const medicaments = specialites && (groupSpecialites(specialites));
        return {
          type: DataTypeEnum.PATHOLOGY,
          result: {
            codePatho: result.codePatho,
            NomPatho: result.NomPatho,
            medicaments: medicaments.map((spec: MedicamentGroup) => spec[0]).length,
          }
        };
      } else {
        //ATC Class
        let subclassesList: AdvancedATC[] = await Promise.all(
          result.subclasses.map(async (atc2) => {
            const substances = await getSubstancesByAtc(atc2);
            let nbSpecialitiesGroupes: number[] = [];
            if(substances) {
              nbSpecialitiesGroupes = await Promise.all( 
                substances.map(async (substance) => {
                  const specialites = await getSubstanceSpecialites(substance.NomId);
                  const specialitiesGroups = groupSpecialites(specialites);
                  return specialitiesGroups ? specialitiesGroups.length : 0;
                })
              );
            }
            nbSpecialitiesGroupes = nbSpecialitiesGroupes.filter((nb) => {
              return nb > 0;
            });
            return {
              nbSubstances: nbSpecialitiesGroupes.length,
              ...atc2,
            }
          })
        );
        let nbSubstances = 0;
        subclassesList = subclassesList.filter((subClass) => subClass.nbSubstances > 0);
        subclassesList.forEach((subClass) => nbSubstances += subClass.nbSubstances);
        return {
          type: DataTypeEnum.ATCCLASS,
          result: {
            class: {
              nbSubstances: nbSubstances,
              ...result.class,
            },
            subclasses: subclassesList,
          }
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
    <>
      <SearchPage
        search={search ? search : undefined}
        filterPregnancy={filterPregnancy}
        filterPediatric={filterPediatric}
        extendedResults={extendedResults ? extendedResults : undefined}
        articlesList={articlesList}
      />
      <RatingToaster
        pageId={`Recherche ${search ? search : ""}`}
      />
    </>
  );
}
