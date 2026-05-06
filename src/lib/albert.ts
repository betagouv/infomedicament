import "server-only";

const BASE_URL = "https://albert.api.etalab.gouv.fr/v1";
export const EMBEDDING_MODEL = "BAAI/bge-m3";

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
