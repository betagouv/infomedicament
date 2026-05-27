const BASE_URL = "https://albert.api.etalab.gouv.fr/v1";
export const EMBEDDING_MODEL = "BAAI/bge-m3";
export const CHAT_MODEL = "mistralai/Ministral-3-8B-Instruct-2512";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

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

export async function chat(
  messages: ChatMessage[],
  responseFormat: { type: "json_object" } = { type: "json_object" },
): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      response_format: responseFormat,
    }),
  });
  if (!res.ok) throw new Error(`Albert chat error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}
