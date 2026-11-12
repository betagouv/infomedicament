import { describe, it, expect, beforeEach, vi } from "vitest";
import { createElement, StrictMode } from "react";
import { render } from "@testing-library/react";
import type { NoticeChunkHit } from "@/app/(container)/medicaments/[slug]/notice-search/route";
import NoticeChunkResultsBox, { highlightTextInElement } from "./NoticeChunkResultsBox";

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

describe("highlight lifecycle", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const hit: NoticeChunkHit = {
    section_anchor: "section", section_title: "Section", sub_header: null, block_id: "first",
  };
  const props = { loading: false, onClose: () => {} };

  it.each([undefined, "dose prescrite"])("clears highlights when results become empty (quote: %s)", (quote) => {
    const block = makeDiv("Ne pas dépasser la dose prescrite.");
    block.dataset.blockId = "first";
    const { rerender } = render(createElement(NoticeChunkResultsBox, { ...props, hits: [{ ...hit, quote }] }));
    expect(document.querySelector(".notice-highlight, mark")).not.toBeNull();
    rerender(createElement(NoticeChunkResultsBox, { ...props, hits: [] }));
    expect(document.querySelector(".notice-highlight, mark")).toBeNull();
    expect(block.textContent).toBe("Ne pas dépasser la dose prescrite.");
  });

  it("replaces the previous highlight and removes the final one on unmount", () => {
    const first = makeDiv("First block");
    first.dataset.blockId = "first";
    const second = makeDiv("Second block");
    second.dataset.blockId = "second";
    const { rerender, unmount } = render(createElement(NoticeChunkResultsBox, { ...props, hits: [hit] }));
    expect(first.classList.contains("notice-highlight")).toBe(true);
    rerender(createElement(NoticeChunkResultsBox, { ...props, hits: [{ ...hit, block_id: "second" }] }));
    expect(first.classList.contains("notice-highlight")).toBe(false);
    expect(second.classList.contains("notice-highlight")).toBe(true);
    unmount();
    expect(second.classList.contains("notice-highlight")).toBe(false);
  });

  it("does not accumulate quote marks in Strict Mode", () => {
    const block = makeDiv("Ne pas dépasser la dose prescrite.");
    block.dataset.blockId = "first";
    const { unmount } = render(createElement(StrictMode, null,
      createElement(NoticeChunkResultsBox, { ...props, hits: [{ ...hit, quote: "dose prescrite" }] }),
    ));
    expect(block.querySelectorAll("mark")).toHaveLength(1);
    unmount();
    expect(block.querySelector("mark")).toBeNull();
    expect(block.textContent).toBe("Ne pas dépasser la dose prescrite.");
  });
});
