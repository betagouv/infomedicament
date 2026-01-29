import { describe, it, expect } from "vitest";
import { getCleanHTML } from "./htmlParser";

describe("getCleanHTML", () => {
  it("should return unchanged HTML when no <a name=> tags present", () => {
    const html = '<p class="AmmCorpsTexte">Simple text</p>';
    expect(getCleanHTML(html)).toBe(html);
  });

  it("should remove <a name=> tags while keeping their content", () => {
    const html = '<p class="AmmAnnexeTitre"><a name="Ann3bNotice">NOTICE</a></p>';
    const expected = '<p class="AmmAnnexeTitre">NOTICE</p>';
    expect(getCleanHTML(html)).toBe(expected);
  });

  it("should handle multiple <a name=> tags in the same string", () => {
    const html =
      '<p><a name="first">Premier</a></p><p><a name="second">Deuxième</a></p>';
    const expected = "<p>Premier</p><p>Deuxième</p>";
    expect(getCleanHTML(html)).toBe(expected);
  });

  it("should handle nested HTML content within <a name=> tags", () => {
    const html =
      '<p><a name="_Toc123"><span class="bold">Titre</span> avec <em>emphase</em></a></p>';
    const expected =
      '<p><span class="bold">Titre</span> avec <em>emphase</em></p>';
    expect(getCleanHTML(html)).toBe(expected);
  });

  it("should handle empty <a name=> tags", () => {
    const html = '<p><a name=""></a>Some text</p>';
    const expected = "<p>Some text</p>";
    expect(getCleanHTML(html)).toBe(expected);
  });

  it("should preserve other anchor tags (with href)", () => {
    const html = '<p><a href="https://example.com">Link</a></p>';
    expect(getCleanHTML(html)).toBe(html);
  });

  it("should handle real-world example from notices JSONL", () => {
    const html =
      '<p class="AmmAnnexeTitre"><a name="Ann3bNotice">NOTICE</a></p>';
    const expected =
      '<p class="AmmAnnexeTitre">NOTICE</p>';
    expect(getCleanHTML(html)).toBe(expected);
  });

  it("should handle <a name=> tag at the beginning of string", () => {
    const html = '<a name="start">Content</a>';
    const expected = "Content";
    expect(getCleanHTML(html)).toBe(expected);
  });
});
