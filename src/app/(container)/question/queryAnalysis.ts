import { z } from "zod";
import { createAlbertChatCompletion } from "@/lib/albert";
import type { SmartSearchExtraction } from "@/types/SmartSearchTypes";

const QUERY_ANALYSIS_MODEL = "mistralai/Ministral-3-8B-Instruct-2512";

const queryAnalysisIntents = [
  "specific_medicine_question",
  "generic_medicine_search",
  "blocked",
  "urgent_medical_attention",
] as const;

const trimmedStringArray = z.array(z.string())
  .transform((items) => items.map((item) => item.trim()).filter(Boolean));

export const queryAnalysisSchema = z.object({
  intent: z.enum(queryAnalysisIntents),
  specialites: trimmedStringArray,
  substances: trimmedStringArray,
  indications: trimmedStringArray,
  searchTerms: trimmedStringArray,
  question: z.string().trim(),
  safetyMessage: z.string()
    .transform((value) => value.trim() || undefined),
}).strict();

export async function analyzeQuery(
  query: string,
): Promise<SmartSearchExtraction> {
  const tool = {
    type: "function",
    function: {
      name: "extract_recherche_intelligente",
      description: "Extrait les éléments utiles à une question sur une notice de médicament en français.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          intent: {
            type: "string",
            enum: queryAnalysisIntents,
            description: "Catégorie principale de la demande.",
          },
          specialites: {
            type: "array",
            items: { type: "string" },
            description: "Noms de spécialités ou marques de médicaments citées.",
          },
          substances: {
            type: "array",
            items: { type: "string" },
            description: "Substances actives citées.",
          },
          indications: {
            type: "array",
            items: { type: "string" },
            description: "Pathologies, symptômes ou indications thérapeutiques citées.",
          },
          searchTerms: {
            type: "array",
            items: { type: "string" },
            description: "Termes auxiliaires compris depuis la demande. Ils ne sont pas utilisés pour la recherche déterministe.",
          },
          question: {
            type: "string",
            description: "Question médicale reformulée uniquement si l'utilisateur pose réellement une question. Chaîne vide pour une requête qui contient seulement un nom de médicament, une substance, une indication ou des mots-clés sans question.",
          },
          safetyMessage: {
            type: "string",
            description: "Message bref si intent vaut blocked ou urgent_medical_attention, sinon chaîne vide.",
          },
        },
        required: ["intent", "specialites", "substances", "indications", "searchTerms", "question", "safetyMessage"],
      },
    },
  };

  const data = await createAlbertChatCompletion({
    model: QUERY_ANALYSIS_MODEL,
    messages: [
      {
        role: "system",
        content: `Tu classes et extrais des données structurées pour une recherche de médicaments en français.

Catégories :
- specific_medicine_question : l'utilisateur cite un médicament précis et pose une question sur sa notice. Les requêtes courtes qui associent un médicament à alcool, grossesse, nourriture, conduite, effet indésirable, interaction ou posologie sont des questions de notice, même si le mélange peut être dangereux. Exemples : "est-ce que je peux prendre du Doliprane enceinte", "Doliprane combien ?", "alcool xanax", "xanax alcool", "ibuprofène grossesse".
- generic_medicine_search : l'utilisateur cherche des médicaments pour un symptôme, une pathologie ou une classe, sans question nécessitant une notice précise. Exemple : "mal de tête quel médicament".
- urgent_medical_attention : la demande décrit une situation déjà arrivée ou en cours, avec prise/ingestion/exposition, surdosage, intoxication, enfant en danger, symptômes graves, ou besoin d'appel immédiat. Exemples : "j'ai pris de l'alcool avec du Xanax", "mon enfant a avalé du Doliprane", "surdosage enfant que faire".
- blocked : la demande cherche à se faire du mal, à mourir, à provoquer une intoxication, ou demande une instruction dangereuse.

N'invente jamais de question. Si la requête contient seulement un nom de médicament, une spécialité, une substance, une indication, ou des mots-clés sans demande implicite de notice, classe-la en generic_medicine_search et mets question à chaîne vide. Exemples : "paracétamol", "xanax", "Doliprane", "ibuprofène 400", "amoxicilline".

Important : une requête télégraphique comme "alcool xanax" ou "xanax alcool" n'est pas une urgence déclarée. Classe-la en specific_medicine_question pour rechercher l'information dans la notice. Ne classe en urgent_medical_attention que si l'utilisateur indique que l'exposition a déjà eu lieu, qu'un enfant est concerné, qu'il y a surdosage/intoxication, ou qu'il décrit des symptômes graves.

Réponds uniquement avec l'appel d'outil demandé. Ne donne pas de conseil médical dans les champs sauf safetyMessage pour les catégories de sécurité.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    tools: [tool],
    tool_choice: {
      type: "function",
      function: { name: "extract_recherche_intelligente" },
    },
    max_tokens: 300,
    temperature: 0,
  }, "Albert query analysis error");

  const message = data.choices?.[0]?.message;
  const toolArguments = message?.tool_calls?.[0]?.function?.arguments;
  if (!toolArguments) {
    throw new Error("Albert query analysis did not return tool arguments");
  }

  return queryAnalysisSchema.parse(JSON.parse(toolArguments)) satisfies SmartSearchExtraction;
}
