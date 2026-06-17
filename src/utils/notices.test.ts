import { describe, it, expect } from "vitest";
import { NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { noticeToText } from "./notices";

const block = (overrides: Partial<Omit<NoticeRCPContentBlock, 'content'>> & { content?: string | string[] }): NoticeRCPContentBlock => ({
  id: 1,
  type: "AmmCorpsTexte",
  content: [],
  children: [],
  anchor: undefined,
  ...overrides,
} as unknown as NoticeRCPContentBlock);

describe("noticeToText", () => {
  it("prefixes section titles with their anchor", () => {
    const result = noticeToText([
      block({ type: "AmmNoticeTitre1", content: "Comment prendre", anchor: "Ann3bCommentPrendre" }),
    ]);
    expect(result).toContain("[Ann3bCommentPrendre]");
    expect(result).toContain("Comment prendre");
  });

  it("includes anchor for AmmAnnexeTitre variants", () => {
    const result = noticeToText([
      block({ type: "AmmAnnexeTitre2", content: "Posologie", anchor: "Ann3bPosologie" }),
    ]);
    expect(result).toContain("[Ann3bPosologie]");
  });

  it("prefixes AmmCorpsTexte blocks with [block-{id}]", () => {
    const result = noticeToText([
      block({ type: "AmmCorpsTexte", id: 98622, content: "Ne pas dépasser la dose prescrite." }),
    ]);
    expect(result).toContain("[block-98622]");
    expect(result).toContain("Ne pas dépasser la dose prescrite.");
  });

  it("wraps AmmCorpsTexteGras in **", () => {
    const result = noticeToText([
      block({ type: "AmmCorpsTexteGras", content: "Adultes" }),
    ]);
    expect(result).toContain("**Adultes**");
  });

  it("formats listePuce items with bullet points", () => {
    const result = noticeToText([
      block({ type: "listePuce", content: ["item A", "item B"] as unknown as string }),
    ]);
    expect(result).toContain("• item A");
    expect(result).toContain("• item B");
  });

  it("recurses into children", () => {
    const result = noticeToText([
      block({
        type: "AmmNoticeTitre1",
        content: "Section",
        anchor: "Sec1",
        children: [
          block({ type: "AmmCorpsTexte", id: 1, content: "Texte enfant." }),
        ],
      }),
    ]);
    expect(result).toContain("[Sec1]");
    expect(result).toContain("[block-1]");
    expect(result).toContain("Texte enfant.");
  });

  it("omits anchor prefix when anchor is absent", () => {
    const result = noticeToText([
      block({ type: "AmmNoticeTitre1", content: "Sans ancre", anchor: undefined }),
    ]);
    expect(result).not.toMatch(/\[undefined\]/);
    expect(result).toContain("Sans ancre");
  });
});
