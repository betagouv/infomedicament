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

Only extract terms that are explicitly present in the query. Do NOT use background knowledge to infer or expand — if the user does not mention an ATC class, leave atc_classes empty even if you know which class the medication belongs to.

Fields:
- medications: trade names explicitly mentioned (e.g. "doliprane", "xanax")
- substances: active substances explicitly mentioned (e.g. "paracétamol", "alprazolam")
- pathologies: symptoms or conditions explicitly mentioned (e.g. "mal de tête", "fièvre", "insomnie")
- atc_classes: pharmacological or therapeutic drug classes explicitly mentioned (e.g. "anxiolytiques", "antibiotiques", "anti-inflammatoires", "antidépresseurs", "bêtabloquants", "anti-douleur", "système nerveux")
- is_relevant: false only if the query is clearly unrelated to medications
- is_dangerous: true ONLY if the user is explicitly seeking to harm themselves or others (e.g. "comment faire une overdose", "comment se suicider avec"). Questions about alcohol interactions, side effects, or risky combinations are NOT dangerous — they are legitimate safety questions.

Example input: "puis-je prendre du doliprane pour un mal de tête ?"
Example output: {"medications":["doliprane"],"substances":[],"pathologies":["mal de tête"],"atc_classes":[],"is_relevant":true,"is_dangerous":false}

Example input: "est-ce que je peux boire de l'alcool avec de l'AdvilCaps ?"
Example output: {"medications":["AdvilCaps"],"substances":[],"pathologies":[],"atc_classes":[],"is_relevant":true,"is_dangerous":false}

Example input: "je peux prendre du tramadol si je suis enceinte ?"
Example output: {"medications":["tramadol"],"substances":[],"pathologies":[],"atc_classes":[],"is_relevant":true,"is_dangerous":false}

Example input: "puis-je boire de l'alcool en prenant du paracétamol ?"
Example output: {"medications":[],"substances":["paracétamol"],"pathologies":[],"atc_classes":[],"is_relevant":true,"is_dangerous":false}

Example input: "peut-on donner de la lidocaïne à un enfant ?"
Example output: {"medications":[],"substances":["lidocaïne"],"pathologies":[],"atc_classes":[],"is_relevant":true,"is_dangerous":false}

Example input: "quels sont les risques de l'alcool avec les anxiolytiques ?"
Example output: {"medications":[],"substances":[],"pathologies":[],"atc_classes":["anxiolytiques"],"is_relevant":true,"is_dangerous":false}`;

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
