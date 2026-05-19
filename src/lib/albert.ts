import "server-only";

const BASE_URL = "https://albert.api.etalab.gouv.fr/v1";
export const CHAT_MODEL = "mistralai/Mistral-Small-3.2-24B-Instruct-2506";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.ALBERT_API_KEY}`,
  };
}


export async function answerNoticeQuestion(
  noticeText: string,
  question: string,
): Promise<{ answer: string; section_anchor: string; sub_header: string; block_id: string; quote: string }> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: `Tu es un assistant médical. Réponds à la question suivante en te basant uniquement sur la notice de médicament fournie.\n\nRetourne un JSON avec exactement cinq champs :\n- "answer": ta réponse en 1 à 3 phrases, extraite directement de la notice\n- "section_anchor": l'identifiant de section entre crochets [ ] le plus pertinent (ex: "Ann3bCommentPrendre"), ou "" si aucun n'est pertinent\n- "sub_header": le texte exact (entre **) du sous-titre en gras le plus pertinent dans cette section, ou "" s'il n'y en a pas\n- "block_id": l'identifiant [block-X] du passage de texte (AmmCorpsTexte) qui contient la réponse, ou "" s'il n'y en a pas\n- "quote": une phrase courte (≤ 20 mots) copiée mot pour mot depuis la notice, issue du bloc block_id, qui répond directement à la question, ou "" si aucune phrase précise n'est identifiable\n\nNotice :\n${noticeText}\n\nQuestion : ${question}`,
        },
      ],
      max_tokens: 400,
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Albert chat error: ${res.status}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content as string);
  return {
    answer: parsed.answer ?? '',
    section_anchor: parsed.section_anchor ?? '',
    sub_header: parsed.sub_header ?? '',
    block_id: parsed.block_id ?? '',
    quote: parsed.quote ?? '',
  };
}
