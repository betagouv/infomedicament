import { AdvancedData, DataTypeEnum } from "./DataTypes";

export type ExtendedSearchResults = { [key in DataTypeEnum]: AdvancedData[] };

export type SearchArticlesFilters = {
  ATCList: string[];
  substancesList: string[];
  specialitesList: string[];
  pathologiesList: string[];
}


