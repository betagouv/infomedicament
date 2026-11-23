import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("server-only", () => ({}));
import NoticeChunkResultsBox from "./NoticeChunkResultsBox";
import DocumentHtml from "../DocumentHtml";
import {
  prepareNoticePassages,
  resolveNoticeSelection,
} from "@/lib/noticePassages";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", "/");
});

function resultFor(
  contentHtml: string,
  match: (html: string) => boolean = () => true,
) {
  const { passages, sourceVersion } = prepareNoticePassages(contentHtml);
  return {
    status: "supported" as const,
    sourceVersion,
    passages: resolveNoticeSelection(passages, {
      status: "supported",
      selections: passages
        .map((passage) => ({
          passage_id: passage.id,
          quote_ids: passage.quotes
            .filter((quote) => match(quote.html))
            .map((quote) => quote.id),
        }))
        .filter((selection) => selection.quote_ids.length),
    }),
  };
}

describe("leaflet excerpt results", () => {
  it.each(["64793681", "64720167", "60234100"])(
    "resolves quote source anchors and text offsets against the rendered full CIS %s leaflet",
    (cis) => {
      const contentHtml = readFileSync(
        `src/testsUtils/fixtures/notice-${cis}.html`,
        "utf8",
      );
      const { passages } = prepareNoticePassages(contentHtml);
      const { container } = render(<DocumentHtml contentHtml={contentHtml} />);
      const elements = Array.from(
        container.querySelectorAll<HTMLElement>(
          "[id], [name], [data-block-id]",
        ),
      );
      for (const quote of passages.flatMap((passage) => passage.quotes)) {
        expect(quote.sources?.length, quote.id).toBeGreaterThan(0);
        for (const source of quote.sources ?? []) {
          const element = elements.find(
            (element) =>
              element.id === source.anchor ||
              element.getAttribute("name") === source.anchor,
          );
          expect(element, source.anchor).toBeDefined();
          const text = element!
            .textContent!.slice(source.start, source.end)
            .replace(/\s+/gu, " ")
            .trim();
          const excerpt = document.createElement("div");
          excerpt.innerHTML = quote.html;
          expect(
            excerpt.textContent!.replace(/\s+/gu, " ").includes(text),
            quote.id,
          ).toBe(true);
        }
      }
    },
  );
  it("displays only source quotations with one link per quote and no joining text", () => {
    const result = resultFor(
      "<h2>Enfants</h2><p>Première condition.</p><p>Deuxième condition.</p><p>Troisième condition.</p>",
    );
    const { container } = render(
      <NoticeChunkResultsBox
        loading={false}
        result={result}
        onClose={vi.fn()}
      />,
    );
    expect(container.querySelectorAll("blockquote")).toHaveLength(3);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(container.querySelector("article > p")).toBeNull();
    expect(screen.queryByText(/Dans la rubrique/)).toBeNull();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls to the exact sentence, highlights its inline text, and preserves glossary markup", () => {
    const contentHtml =
      '<h2 id="section">Enfants</h2><p data-block-id="paragraph">Avant. Condition <strong data-definition="test">exacte &amp; complète</strong>. Après.</p>';
    const result = resultFor(contentHtml, (html) => html.includes("exacte"));
    const { container } = render(
      <>
        <div id="noticeContainer">
          <DocumentHtml contentHtml={contentHtml} />
        </div>
        <NoticeChunkResultsBox
          loading={false}
          result={result}
          onClose={vi.fn()}
        />
      </>,
    );
    const link = screen.getByRole("link", {
      name: "Source [1] — Voir dans la notice",
    });
    expect(link.getAttribute("href")).toBe("#notice-block-paragraph");
    fireEvent.click(link);
    const source = container.querySelector("#noticeContainer")!;
    expect(
      Array.from(source.querySelectorAll("mark"))
        .map((mark) => mark.textContent)
        .join(""),
    ).toBe("Condition exacte & complète.");
    expect(source.querySelector("p")?.textContent).toBe(
      "Avant. Condition exacte & complète. Après.",
    );
    expect(source.querySelector('[data-definition="test"] strong')).toBeNull();
    expect(
      source.querySelector('strong[data-definition="test"]'),
    ).not.toBeNull();
    expect(container.querySelector("article mark")).toBeNull();
    expect(window.location.hash).toBe("#notice-block-paragraph");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "center",
    });
    fireEvent.click(link);
    expect(source.querySelector("mark mark")).toBeNull();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("links each list quotation to its actual bullet and highlights the shared condition once", () => {
    const contentHtml =
      '<h2>Précautions</h2><p data-block-id="intro">Ne prenez jamais :</p><ul><li data-block-id="first">Condition A.</li><li data-block-id="second">Condition B.</li><li data-block-id="third">Condition C.</li></ul>';
    const result = resultFor(
      contentHtml,
      (html) => html.includes("Condition B") || html.includes("Condition C"),
    );
    const { container, rerender } = render(
      <>
        <div id="noticeContainer">
          <DocumentHtml contentHtml={contentHtml} />
        </div>
        <NoticeChunkResultsBox
          loading={false}
          result={result}
          onClose={vi.fn()}
        />
      </>,
    );
    const link = screen.getByRole("link", {
      name: "Source [1] — Voir dans la notice",
    });
    expect(link.getAttribute("href")).toBe("#notice-block-second");
    expect(container.querySelector("blockquote")?.textContent).toBe(
      "Ne prenez jamais :Condition B.Condition C.",
    );
    fireEvent.click(link);
    expect(container.querySelector("#notice-block-first mark")).toBeNull();
    expect(
      container.querySelector("#notice-block-second mark")?.textContent,
    ).toBe("Condition B.");
    expect(
      container.querySelector("#notice-block-third mark")?.textContent,
    ).toBe("Condition C.");
    expect(container.querySelectorAll("#notice-block-intro mark")).toHaveLength(
      1,
    );
    rerender(
      <>
        <div id="noticeContainer">
          <DocumentHtml contentHtml={contentHtml} />
        </div>
        <NoticeChunkResultsBox
          loading={false}
          result={null}
          onClose={vi.fn()}
        />
      </>,
    );
    expect(container.querySelectorAll("mark")).toHaveLength(0);
  });

  it("keeps ordinary modified-click navigation and stable links for legacy source paragraphs", () => {
    const contentHtml =
      '<h2 id="section">Section</h2><p>Condition complète.</p>';
    const { container } = render(
      <>
        <div id="noticeContainer">
          <DocumentHtml contentHtml={contentHtml} />
        </div>
        <NoticeChunkResultsBox
          loading={false}
          result={resultFor(contentHtml)}
          onClose={vi.fn()}
        />
      </>,
    );
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("#notice-source-0");
    expect(container.querySelector("#notice-source-0")?.textContent).toBe(
      "Condition complète.",
    );
    fireEvent.click(link, { ctrlKey: true });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(container.querySelector("mark")).toBeNull();
  });

  it.each([
    ["insufficient_evidence", "Nous n’avons pas identifié"],
    ["unavailable", "La notice n’est pas disponible"],
    ["error", "La recherche dans la notice n’a pas pu aboutir"],
  ] as const)("shows a distinct %s message", (status, message) => {
    render(
      <NoticeChunkResultsBox
        loading={false}
        result={{ status, passages: [] }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain(message);
  });
});
