import type { NoticeChunkHit } from "@/app/(container)/medicaments/[CIS]/notice-search/route";
import type { MatchReason, SearchResultItem } from "./SearchTypes";

export type SmartSearchIntent =
  | "specific_medicine_question"
  | "generic_medicine_search"
  | "blocked"
  | "urgent_medical_attention";

export type SmartSearchExtraction = {
  intent: SmartSearchIntent;
  specialites: string[];
  substances: string[];
  indications: string[];
  searchTerms: string[];
  question: string;
  safetyMessage?: string;
};

export type SmartSearchCandidate = {
  specId: string;
  specName: string;
  groupName: string;
  score: number;
  matchReasons: MatchReason[];
};

export type SmartSearchStatus =
  | "answered"
  | "needs_confirmation"
  | "results"
  | "blocked"
  | "urgent_medical_attention"
  | "no_results"
  | "no_notice"
  | "no_answer";

export type SmartSearchResponse = {
  status: SmartSearchStatus;
  extraction: SmartSearchExtraction;
  searchQuery: string;
  selectedCandidate?: SmartSearchCandidate;
  candidates: SmartSearchCandidate[];
  searchResults: SearchResultItem[];
  hits: NoticeChunkHit[];
  topBlock?: {
    kind: "notice_answer" | "confirmation" | "blocked" | "urgent_medical_attention" | "no_answer" | "no_notice";
    title: string;
    message: string;
  };
};
