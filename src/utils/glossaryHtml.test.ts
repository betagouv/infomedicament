import { describe, expect, it } from "vitest";
import { prepareGlossaryHtml } from "./glossaryHtml";

const definition = {
  nom: "Excipient",
  definition: "Definition",
  source: "BDPM",
  a_souligner: true,
};

describe("prepareGlossaryHtml", () => {
  it("prepares keyboard and dialog semantics without changing document structure", () => {
    const html = prepareGlossaryHtml(
      '<p data-block-id="block"><span data-definition="Excipient"><em>excipients</em></span></p>',
      [definition],
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    const term = container.querySelector("[data-definition]")!;
    expect(term.getAttribute("tabindex")).toBe("0");
    expect(term.getAttribute("role")).toBe("button");
    expect(term.getAttribute("aria-haspopup")).toBe("dialog");
    expect(term.getAttribute("aria-label")).toBe(
      "Voir la définition de excipients",
    );
    expect(term.querySelector("em")?.textContent).toBe("excipients");
    expect(container.firstElementChild?.getAttribute("data-block-id")).toBe(
      "block",
    );
  });

  it("leaves unknown definitions and unmarked documents unchanged", () => {
    const html = '<p><span data-definition="Unknown">term</span></p>';
    expect(prepareGlossaryHtml(html, [definition])).toBe(html);
    expect(prepareGlossaryHtml(html, [])).toBe(html);
    expect(prepareGlossaryHtml("<p>Unmarked text</p>", [definition])).toBe(
      "<p>Unmarked text</p>",
    );
  });

  it("escapes attribute values without interpreting definition words as markup", () => {
    const html = prepareGlossaryHtml(
      '<span data-definition="Excipient">&quot;excipient&quot; &amp; compagnie</span>',
      [definition],
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.firstElementChild?.getAttribute("aria-label")).toBe(
      'Voir la définition de "excipient" & compagnie',
    );
  });
});
