import { getSearchResults } from "@/db/utils";
import { getNotice } from "@/db/utils/notice";
import { noticeToText } from "@/utils/notices";
import type { SearchResultItem } from "@/types/SearchTypes";
import type {
  SmartSearchCandidate,
  SmartSearchExtraction,
  SmartSearchResponse,
} from "@/types/SmartSearchTypes";
import { extractBlockId } from "@/app/(container)/medicaments/[CIS]/notice-search/route";
import { answerNoticeQuestion } from "@/app/(container)/medicaments/[CIS]/notice-search/answerNoticeQuestion";
import { analyzeQuery } from "./queryAnalysis";

const CLEAR_WINNER_SCORE_GAP = 0.75;
const DEFAULT_URGENT_MESSAGE = "Cette situation peut nécessiter une prise en charge immédiate. Appelez le 15 ou le 112. En cas de risque suicidaire, appelez aussi le 3114.";
const DEFAULT_BLOCKED_MESSAGE = "Nous ne pouvons pas aider à se faire du mal ou à provoquer une situation dangereuse. Si vous êtes en danger immédiat, appelez le 15 ou le 112. Si vous pensez au suicide, appelez le 3114.";

function stripBold(value: string): string {
  return value.replace(/\*\*/g, "").trim();
}

function toCandidate(result: SearchResultItem): SmartSearchCandidate {
  return {
    specId: result.specId,
    specName: result.specName,
    groupName: result.groupName,
    score: result.score,
    matchReasons: result.matchReasons,
  };
}

export function buildSmartSearchQuery(extraction: SmartSearchExtraction): string {
  const extractedTerms = extraction.specialites.length > 0
    ? extraction.specialites
    : extraction.substances.length > 0
      ? extraction.substances
      : extraction.indications;

  return [...new Set(extractedTerms.map((term) => term.trim()).filter(Boolean))]
    .join(" ")
    .trim();
}

export function hasClearWinner(candidates: SmartSearchCandidate[]): boolean {
  if (candidates.length === 0) return false;
  if (candidates.length === 1) return true;
  return candidates[0].score >= candidates[1].score + CLEAR_WINNER_SCORE_GAP;
}

async function answerFromNotice(
  candidate: SmartSearchCandidate,
  question: string,
): Promise<SmartSearchResponse["hits"] | undefined> {
  const notice = await getNotice(candidate.specId);
  if (!notice?.children?.length) return undefined;

  const noticeText = noticeToText(notice.children);
  const result = await answerNoticeQuestion(noticeText, question);
  const answer = stripBold(result.answer);

  if (!answer) return [];

  return [{
    section_anchor: result.section_anchor,
    section_title: "",
    sub_header: result.sub_header ? stripBold(result.sub_header) : null,
    answer,
    block_id: result.block_id ? extractBlockId(result.block_id) : undefined,
    quote: result.quote || answer,
  }];
}

export async function getSmartSearchResponse(
  query: string,
  selectedSpecId?: string,
): Promise<SmartSearchResponse> {
  let extraction: SmartSearchExtraction;
  try {
    extraction = await analyzeQuery(query);
  } catch (err) {
    console.error("[rechercher] query analysis error", err);
    const searchQuery = query.trim();
    const searchResults = searchQuery ? await getSearchResults(searchQuery) : [];

    return {
      status: searchResults.length > 0 ? "results" : "no_results",
      extraction: {
        intent: "generic_medicine_search",
        specialites: [],
        substances: [],
        indications: [],
        searchTerms: searchQuery ? [searchQuery] : [],
        question: "",
      },
      searchQuery,
      candidates: searchResults.slice(0, 5).map(toCandidate),
      searchResults,
      hits: [],
    };
  }
  const searchQuery = buildSmartSearchQuery(extraction);
  const emptyResponse = {
    extraction,
    searchQuery,
    candidates: [],
    searchResults: [],
    hits: [],
  };

  if (extraction.intent === "blocked") {
    return {
      status: "blocked",
      ...emptyResponse,
      topBlock: {
        kind: "blocked",
        title: "Recherche non disponible",
        message: DEFAULT_BLOCKED_MESSAGE,
      },
    };
  }

  if (extraction.intent === "urgent_medical_attention") {
    return {
      status: "urgent_medical_attention",
      ...emptyResponse,
      topBlock: {
        kind: "urgent_medical_attention",
        title: "Situation urgente",
        message: DEFAULT_URGENT_MESSAGE,
      },
    };
  }

  if (!searchQuery) {
    return {
      status: "no_results",
      ...emptyResponse,
    };
  }

  const results = await getSearchResults(searchQuery);
  const candidates = results.slice(0, 5).map(toCandidate);

  if (candidates.length === 0) {
    return {
      status: "no_results",
      ...emptyResponse,
    };
  }

  if (extraction.intent === "generic_medicine_search" || !extraction.question) {
    return {
      status: "results",
      extraction,
      searchQuery,
      candidates,
      searchResults: results,
      hits: [],
    };
  }

  const selectedCandidate = selectedSpecId
    ? candidates.find((candidate) => candidate.specId === selectedSpecId)
    : hasClearWinner(candidates)
      ? candidates[0]
      : undefined;

  if (!selectedCandidate) {
    return {
      status: "needs_confirmation",
      extraction,
      searchQuery,
      candidates,
      searchResults: results,
      hits: [],
      topBlock: {
        kind: "confirmation",
        title: "Plusieurs notices possibles",
        message: "Sélectionnez la notice à consulter pour rechercher un extrait précis.",
      },
    };
  }

  let hits: SmartSearchResponse["hits"] | undefined;
  try {
    hits = await answerFromNotice(selectedCandidate, extraction.question);
  } catch (err) {
    console.error("[rechercher] notice answer error", err);
    hits = [];
  }

  if (!hits) {
    return {
      status: "no_notice",
      extraction,
      searchQuery,
      selectedCandidate,
      candidates,
      searchResults: results,
      hits: [],
      topBlock: {
        kind: "no_notice",
        title: "Notice indisponible",
        message: "La notice n’est pas disponible pour ce médicament.",
      },
    };
  }

  return {
    status: hits.length > 0 ? "answered" : "no_answer",
    extraction,
    searchQuery,
    selectedCandidate,
    candidates,
    searchResults: results,
    hits,
    topBlock: hits.length > 0
      ? {
          kind: "notice_answer",
          title: "Extrait de la notice",
          message: "La réponse ci-dessous est copiée depuis la notice sélectionnée.",
        }
      : {
          kind: "no_answer",
          title: "Aucun extrait trouvé",
          message: "Aucun passage de la notice ne permet de répondre à cette question.",
        },
  };
}
