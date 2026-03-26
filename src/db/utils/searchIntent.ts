export type IntentMapping = {
  triggerKeywords: string[]; // lowercased, accent-free — what users might type
  sectionTitleQuery: string; // canonical terms to match in section_title
  anchorIds?: string[];      // headerId from notices_anchors, when section has known anchors
};

const INTENT_MAPPINGS: IntentMapping[] = [
  {
    triggerKeywords: ["grossesse", "enceinte", "allaitement", "fertilite", "femme enceinte", "bebe a naitre"],
    sectionTitleQuery: "grossesse allaitement",
    anchorIds: ["RcpFertGrossAllait", "Ann3bInfoNecessaires"],
  },
  {
    triggerKeywords: ["enfant", "bebe", "nourrisson", "adolescent", "pediatrie", "pediatrique"],
    sectionTitleQuery: "enfants adolescents",
    anchorIds: ["RcpPosoAdmin", "Ann3bCommentPrendre"],
  },
  {
    triggerKeywords: ["posologie", "dose", "dosage", "combien prendre", "combien en prendre", "combien"],
    sectionTitleQuery: "posologie dose",
    anchorIds: ["RcpPosoAdmin", "Ann3bCommentPrendre"],
  },
  {
    triggerKeywords: ["effets indesirables", "effets secondaires", "indesirables", "effets", "effet secondaire"],
    sectionTitleQuery: "effets indesirables",
    anchorIds: ["RcpEffetsIndesirables", "Ann3bEffetsIndesirables"],
  },
  {
    triggerKeywords: ["conservation", "conserver", "stocker", "stockage"],
    sectionTitleQuery: "conservation",
    anchorIds: ["RcpDureeConservation", "Ann3bConservation"],
  },
  {
    triggerKeywords: ["conduite", "conduire", "vehicule", "machine"],
    sectionTitleQuery: "conduite vehicules machines",
    anchorIds: ["RcpConduite"],
  },
  {
    triggerKeywords: ["allergie", "allergique", "allergies"],
    sectionTitleQuery: "allergie",
    anchorIds: ["RcpMisesEnGarde", "Ann3bInfoNecessaires"],
  },
  {
    triggerKeywords: ["interaction", "autres medicaments", "avec d autres medicaments"],
    sectionTitleQuery: "interactions medicaments",
    anchorIds: ["RcpInteractionsMed", "Ann3bInfoNecessaires"],
  },
  {
    triggerKeywords: ["alcool", "aliment", "boire", "manger"],
    sectionTitleQuery: "alcool aliments boissons",
    anchorIds: ["RcpInteractionsMed", "RcpMisesEnGarde", "Ann3bInfoNecessaires"],
  },
  {
    triggerKeywords: ["contre-indication", "contre indication", "deconseille", "interdit"],
    sectionTitleQuery: "contre-indications",
    anchorIds: ["RcpContreindications", "Ann3bInfoNecessaires"],
  },
  {
    triggerKeywords: ["duree", "combien de temps", "traitement"],
    sectionTitleQuery: "duree traitement",
    anchorIds: ["RcpPosoAdmin", "Ann3bCommentPrendre"],
  },
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "");
}

/**
 * Bidirectional stem match: returns true if either word is a prefix of the other.
 * Handles French plurals in both directions:
 *   stemMatches("effets", "effet") = true  (query is plural, trigger is singular)
 *   stemMatches("effet", "effets") = true  (query is singular, trigger is plural)
 * Min length 4 prevents short words from causing false positives.
 */
function stemMatches(a: string, b: string): boolean {
  const minLen = Math.min(a.length, b.length);
  return minLen >= 4 && (a.startsWith(b) || b.startsWith(a));
}

/** Returns true if any word in the query stem-matches any word in the trigger keyword. */
function queryMatchesTrigger(queryWords: string[], triggerKeyword: string): boolean {
  const triggerWords = normalize(triggerKeyword).split(/\s+/);
  return triggerWords.every((tw) => queryWords.some((qw) => stemMatches(qw, tw)));
}

export function detectQueryIntent(query: string): IntentMapping | null {
  const queryWords = normalize(query).split(/\s+/);
  for (const mapping of INTENT_MAPPINGS) {
    const matchedKw = mapping.triggerKeywords.find((kw) => queryMatchesTrigger(queryWords, kw));
    if (matchedKw) {
      console.log(`[searchIntent] "${query}" → intent detected via keyword "${matchedKw}" → sectionTitleQuery="${mapping.sectionTitleQuery}"${mapping.anchorIds ? ` anchorIds=[${mapping.anchorIds.join(", ")}]` : ""}`);
      return mapping;
    }
  }
  console.log(`[searchIntent] "${query}" → no intent detected`);
  return null;
}

/**
 * Strips intent-related words from the query, leaving only the medication name part.
 * e.g. "Xanax effets indésirables" → "Xanax"
 */
export function stripIntentFromQuery(query: string, mapping: IntentMapping): string {
  const intentWords = mapping.triggerKeywords.flatMap((kw) => kw.split(/\s+/)).map(normalize);
  const isIntentWord = (word: string) => {
    const nw = normalize(word);
    return intentWords.some((kw) => stemMatches(nw, kw));
  };
  const originalWords = query.split(/\s+/);
  const cleaned = originalWords.filter((word) => !isIntentWord(word)).join(" ").trim();
  console.log(`[searchIntent] stripped intent words → medication query: "${cleaned || query}"`);
  return cleaned || query; // fallback to original if everything was stripped
}

/**
 * Strips the medication name from the query, leaving only the intent part.
 * Uses the already-computed medicationQuery as reference.
 * e.g. "Xanax effets indésirables", medicationQuery="Xanax" → "effets indésirables"
 */
export function stripSpecialiteFromQuery(query: string, medicationQuery: string): string {
  const medWords = new Set(medicationQuery.toLowerCase().split(/\s+/));
  const originalWords = query.split(/\s+/);
  const cleaned = originalWords
    .filter((word) => !medWords.has(word.toLowerCase()))
    .join(" ")
    .trim();
  console.log(`[searchIntent] stripped medication words → section query: "${cleaned || query}"`);
  return cleaned || query; // fallback to original if everything was stripped
}
