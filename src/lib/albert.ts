import "server-only";

const BASE_URL = "https://albert.api.etalab.gouv.fr/v1";
export const EMBEDDING_MODEL = "BAAI/bge-m3";
export const CHAT_MODEL = "mistralai/Ministral-3-8B-Instruct-2512";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.ALBERT_API_KEY}`,
  };
}

export async function embed(input: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
  });
  if (!res.ok) throw new Error(`Albert embeddings error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function generateHypothetical(query: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: `Tu es le texte brut d'une notice de médicament française. Écris une ou deux phrases qui répondent directement à la question, dans le style concis et factuel d'une notice officielle (posologie, contre-indications, effets indésirables, etc.). Pas de markdown, pas de listes, pas de formules de politesse, pas de valeurs entre crochets. Commence directement par l'information. Question : ${query}`,
        },
      ],
      max_tokens: 150,
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`Albert chat error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}
