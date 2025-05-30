import { fr } from "@codegouvfr/react-dsfr";
;
import { getSearchResults, getSpecialite, groupSpecialites } from "@/db/utils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { ExtendedSearchResults, SearchTypeEnum } from "@/types/SearchType";
import { getAtc1, getAtc2, getAtcCode } from "@/data/grist/atc";
import { getPathoSpecialites, getSubstanceSpecialites, SearchResultItem } from "@/db/utils/search";
import { getPregnancyAlerts } from "@/data/grist/pregnancy";
import { getPediatricsForList } from "@/data/grist/pediatrics";

type ExtendedOrderResults = { 
  counter: number,
  results: ExtendedSearchResults,
};

//TODO clean empty ?
//TODO quand base maj peut-être mettre les données en plus dans le calcul des résultats
async function getExtendedOrderedResults(results: SearchResultItem[]): Promise<ExtendedOrderResults> {
  let counter = 0;
  const extentedOrderedResults: ExtendedSearchResults = {
    [SearchTypeEnum.MEDGROUP]: [],
    [SearchTypeEnum.SUBSTANCE]: [],
    [SearchTypeEnum.PATHOLOGY]: [],
    [SearchTypeEnum.ATCCLASS]: [],
  }
  const pregnancyAlerts = await getPregnancyAlerts();
  await Promise.all(
    results.map(async (result: SearchResultItem) => {
      counter ++;
      if("NomLib" in result) {
        //Substance
        const specialites = await getSubstanceSpecialites(result.NomId);
        const specialitiesGroups = await groupSpecialites(specialites);
        extentedOrderedResults[SearchTypeEnum.SUBSTANCE].push({
          nbSpecs: specialitiesGroups.length,
          ...result
        });
      } else if("groupName" in result){
        //Med Group
        //TODO await getSearchMedicamentGroupListFromMedicamentGroupList(medicaments);
        const CISList = result.specialites.map(spec => spec.SpecId);
        const atc = getAtcCode(result.specialites[0].SpecId);
        const { composants } = await getSpecialite(result.specialites[0].SpecId);
        const pregnancyAlert = pregnancyAlerts.find((s) =>
          composants.find((c) => Number(c.SubsId.trim()) === Number(s.id)),
        );
        extentedOrderedResults[SearchTypeEnum.MEDGROUP].push({
          atc1: await getAtc1(atc),
          atc2: await getAtc2(atc),
          composants: composants,
          pregnancyAlert: !!pregnancyAlert,
          pediatrics: await getPediatricsForList(CISList),
          ...result,
        });
      } else if("NomPatho" in result) {
        //Pathology
        const specialites = await getPathoSpecialites(result.codePatho);
        extentedOrderedResults[SearchTypeEnum.PATHOLOGY].push({
          nbSpecs: specialites.length,
          ...result
        });
      } else {
        //ATC Class
        extentedOrderedResults[SearchTypeEnum.ATCCLASS].push(result);
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
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <form
            action="/rechercher"
            className={fr.cx("fr-mt-4w", "fr-mb-1w")}
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
        <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            Il n’y a aucun résultat.
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
