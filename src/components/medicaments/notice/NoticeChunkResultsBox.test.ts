import { describe, it, expect, beforeEach } from "vitest";
import { highlightTextInElement } from "./NoticeChunkResultsBox";

function makeDiv(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  document.body.appendChild(div);
  return div;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("highlightTextInElement", () => {
  it("wraps matching text in a <mark> element", () => {
    const el = makeDiv("Ne pas dépasser la dose prescrite.");
    const mark = highlightTextInElement(el, "dose prescrite");
    expect(mark).not.toBeNull();
    expect(mark?.tagName).toBe("MARK");
    expect(mark?.textContent).toBe("dose prescrite");
    expect(mark?.className).toBe("notice-highlight-quote");
  });

  it("inserts the mark into the DOM", () => {
    const el = makeDiv("Prendre un comprimé par jour.");
    highlightTextInElement(el, "comprimé par jour");
    expect(el.querySelector("mark")).not.toBeNull();
    expect(el.querySelector("mark")?.textContent).toBe("comprimé par jour");
  });

  it("returns null when quote is not found", () => {
    const el = makeDiv("Prendre un comprimé par jour.");
    const mark = highlightTextInElement(el, "texte absent");
    expect(mark).toBeNull();
    expect(el.querySelector("mark")).toBeNull();
  });

  it("finds text in a nested element", () => {
    const el = makeDiv("<p>Consulter un médecin si les symptômes persistent.</p>");
    const mark = highlightTextInElement(el, "symptômes persistent");
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe("symptômes persistent");
  });

  it("mark can be cleanly unwrapped by replaceWith", () => {
    const el = makeDiv("Sauf avis médical, durée limitée à 5 jours.");
    const mark = highlightTextInElement(el, "durée limitée à 5 jours");
    expect(mark).not.toBeNull();
    mark!.replaceWith(...mark!.childNodes);
    expect(el.querySelector("mark")).toBeNull();
    expect(el.textContent).toBe("Sauf avis médical, durée limitée à 5 jours.");
  });
});
