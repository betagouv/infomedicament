import { z } from "zod";
import { CHAT_MODEL, createAlbertChatCompletion } from "@/lib/albert";

export const noticeQuestionAnswerSchema = z.object({
  answer: z.string(),
  section_anchor: z.string(),
  sub_header: z.string(),
  block_id: z.string(),
  quote: z.string(),
}).strict();

export type NoticeQuestionAnswer = z.infer<typeof noticeQuestionAnswerSchema>;

export async function answerNoticeQuestion(
  noticeText: string,
  question: string,
): Promise<NoticeQuestionAnswer> {
  const tool = {
    type: "function",
    function: {
      name: "answer_notice_question",
      description: "Identifie dans une notice le passage qui répond directement à une question.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          answer: {
            type: "string",
            description: "Extrait copié mot pour mot depuis la notice, sans reformulation ni conclusion médicale ajoutée. Chaîne vide si aucun passage ne répond.",
          },
          section_anchor: {
            type: "string",
            description: "Identifiant de section entre crochets [ ] le plus pertinent, par exemple Ann3bCommentPrendre, ou chaîne vide.",
          },
          sub_header: {
            type: "string",
            description: "Texte exact du sous-titre en gras le plus pertinent dans cette section, ou chaîne vide.",
          },
          block_id: {
            type: "string",
            description: "Identifiant [block-X] du passage de texte qui contient la réponse, ou chaîne vide.",
          },
          quote: {
            type: "string",
            description: "Phrase courte de 20 mots maximum copiée mot pour mot depuis la notice et issue du bloc block_id, ou chaîne vide.",
          },
        },
        required: ["answer", "section_anchor", "sub_header", "block_id", "quote"],
      },
    },
  };

  const data = await createAlbertChatCompletion({
    model: CHAT_MODEL,
    messages: [
      {
        role: "user",
        content: `Tu es un assistant médical. Réponds à la question suivante en te basant uniquement sur la notice de médicament fournie.

N'invente rien, ne reformule pas, ne conclus pas toi-même. Si la notice ne contient pas de passage permettant de répondre, retourne des chaînes vides.

Notice :
${noticeText}

Question : ${question}`,
      },
    ],
    tools: [tool],
    tool_choice: {
      type: "function",
      function: { name: "answer_notice_question" },
    },
    max_tokens: 1000,
    temperature: 0,
  });

  const toolArguments = data.choices[0].message.tool_calls?.[0]?.function?.arguments;
  if (!toolArguments) {
    throw new Error("Albert notice answer did not return tool arguments");
  }

  return noticeQuestionAnswerSchema.parse(JSON.parse(toolArguments));
}
