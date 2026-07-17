import "server-only";

const BASE_URL = "https://albert.api.etalab.gouv.fr/v1";
export const CHAT_MODEL = "mistralai/Mistral-Small-3.2-24B-Instruct-2506";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.ALBERT_API_KEY}`,
  };
}


export function parseAlbertJson(content: string): Record<string, string> {
  const raw = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(raw);
}

export type AlbertChatCompletionResponse = {
  choices: Array<{
    message: {
      content?: string;
      tool_calls?: Array<{
        function?: {
          arguments?: string;
        };
      }>;
    };
  }>;
};

export async function createAlbertChatCompletion(
  body: Record<string, unknown>,
  errorMessage = "Albert chat error",
): Promise<AlbertChatCompletionResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${errorMessage}: ${res.status}`);
  return await res.json();
}
