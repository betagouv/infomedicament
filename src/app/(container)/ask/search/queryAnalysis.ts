import { chat } from "@/lib/albert";

export interface QueryAnalysis {
  medications: string[];
  substances: string[];
  pathologies: string[];
  atc_classes: string[];
  is_relevant: boolean;
  is_dangerous: boolean;
}

const FALLBACK: QueryAnalysis = {
  medications: [],
  substances: [],
  pathologies: [],
  atc_classes: [],
  is_relevant: true,
  is_dangerous: false,
};

const SYSTEM_PROMPT = `You analyze French user queries about medications. Extract structured information and respond with JSON only.

Fields:
- medications: trade names (e.g. "doliprane", "xanax")
- substances: active substances (e.g. "paracétamol", "alprazolam")
- pathologies: symptoms or conditions (e.g. "mal de tête", "fièvre", "insomnie")
- atc_classes: therapeutic classes (e.g. "anti-douleur", "système nerveux")
- is_relevant: false only if the query is clearly unrelated to medications
- is_dangerous: true ONLY if the user is explicitly seeking to harm themselves or others (e.g. "comment faire une overdose", "comment se suicider avec"). Questions about alcohol interactions, side effects, or risky combinations are NOT dangerous — they are legitimate safety questions.

Example input: "puis-je prendre du doliprane pour un mal de tête ?"
Example output: {"medications":["doliprane"],"substances":[],"pathologies":["mal de tête"],"atc_classes":[],"is_relevant":true,"is_dangerous":false}

Example input: "est-ce que je peux boire de l'alcool avec de l'AdvilCaps ?"
Example output: {"medications":["AdvilCaps"],"substances":["ibuprofène"],"pathologies":[],"atc_classes":[],"is_relevant":true,"is_dangerous":false}`;

export async function analyzeQuery(query: string): Promise<QueryAnalysis> {
  try {
    const content = await chat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ]);
    console.log("[analyzeQuery] raw LLM response:", content);
    const parsed = JSON.parse(content);
    const result = {
      medications: parsed.medications ?? [],
      substances: parsed.substances ?? [],
      pathologies: parsed.pathologies ?? [],
      atc_classes: parsed.atc_classes ?? [],
      is_relevant: parsed.is_relevant ?? true,
      is_dangerous: parsed.is_dangerous ?? false,
    };
    console.log("[analyzeQuery]", JSON.stringify(result));
    return result;
  } catch (err) {
    console.error("[analyzeQuery] failed, using fallback:", err);
    return FALLBACK;
  }
}
