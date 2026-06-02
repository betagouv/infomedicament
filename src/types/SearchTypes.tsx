import { ResumeSpecialite } from "./SpecialiteTypes";

export type SearchArticlesFilters = {
  ATCList: string[];
  substancesList: string[];
  specialitesList: string[];
  pathologiesList: number[];
}

export type SearchFilter = {
  id: string,
  name: string, 
  children?: SearchFilter[],
  count: number,
  selected: boolean,
}

export type SortType = "alphabetic" | "score";

export type MatchReason = {
  type: "name" | "substance" | "atc" | "indication";
  label: string;
};

export type SearchResultItem = ResumeSpecialite & {
  matchReasons: MatchReason[];
  score: number;
};
