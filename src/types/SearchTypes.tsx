import { ResumeSpecialite } from "./SpecialiteTypes";
import type { MatchReason } from "@/schemas/autocomplete";
export type {
  MatchReason,
  AutocompleteSuggestionType,
  AutocompleteSuggestion,
  AutocompleteSection,
} from "@/schemas/autocomplete";

export type SearchArticlesFilters = {
  ATCList: string[];
  substancesList: string[];
  specialitesList: string[];
  pathologiesList: number[];
}

export type SearchFilter = {
  id: string,
  name: string,
  secondaryName?: string,
  children?: SearchFilter[],
  count: number,
  selected: boolean,
}

export type SortType = "alphabetic" | "score";

export type SearchResultItem = ResumeSpecialite & {
  advancedDetails?: {
    authorizationStatus: string | null;
    authorizationDate: string | null;
    commercialisation: string;
    hasRcp: boolean;
    rcpUpdatedAt: string | null;
  };
  authorizationStatus?: string | null;
  isHistorical?: boolean;
  matchReasons: MatchReason[];
  score: number;
};
