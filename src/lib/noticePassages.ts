import "server-only";

import { createHash } from "node:crypto";
import { HTMLElement, Node, TextNode, parse } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import type {
  NoticePassage,
  NoticeQuote,
  NoticeQuoteSource,
  NoticeSourceTarget,
} from "@/types/NoticeSearch";
import {
  documentSourceSelector,
  getDocumentBlockAnchor,
  getDocumentSourceAnchor,
} from "@/utils/documentSourceAnchors";

interface Section {
  level: number;
  heading?: HTMLElement;
  parent?: Section;
  intro: Node[];
  nodes: Node[];
}

const selectionSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("supported"),
      selections: z
        .array(
          z
            .object({
              passage_id: z.string().min(1),
              quote_ids: z.array(z.string().min(1)).min(1),
            })
            .strict(),
        )
        .min(1),
    })
    .strict(),
  z
    .object({
      status: z.literal("insufficient_evidence"),
      selections: z.array(z.never()).length(0),
    })
    .strict(),
]);

export type NoticeSelection = z.infer<typeof selectionSchema>;

// Derive generation constraints from the same schema used to validate responses.
export const noticeSelectionJsonSchema = z.toJSONSchema(selectionSchema, {
  target: "draft-7",
});

const sentenceSegmenter = new Intl.Segmenter("fr", { granularity: "sentence" });

function headingLevel(element: HTMLElement): number | undefined {
  const heading = /^H([1-6])$/.exec(element.tagName);
  if (heading) return Number(heading[1]);
  const legacy = /\bAmmNoticeTitre([1-6])\b/.exec(
    element.getAttribute("class") ?? "",
  );
  return legacy ? Number(legacy[1]) + 1 : undefined;
}

// Flatten layout wrappers, never medical structures such as tables, lists or figures.
function flowNodes(node: Node): Node[] {
  if (
    node instanceof HTMLElement &&
    /^(HTML|BODY|MAIN|ARTICLE|SECTION|DIV)$/.test(node.tagName)
  ) {
    return node.childNodes.flatMap(flowNodes);
  }
  return [node];
}

function sourceTarget(
  nodes: Node[],
  firstAnchors: Map<string, HTMLElement>,
): NoticeSourceTarget {
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    const anchorElement =
      node.hasAttribute("id") || node.hasAttribute("name")
        ? node
        : node.querySelector("[id], [name]");
    const anchor =
      anchorElement?.getAttribute("id") ?? anchorElement?.getAttribute("name");
    const blockId = node.getAttribute("data-block-id");
    if (anchor || blockId)
      return {
        anchor:
          blockId && (!anchor || firstAnchors.get(anchor) !== anchorElement)
            ? getDocumentBlockAnchor(blockId)
            : anchor,
        blockId,
      };
  }
  return {};
}

function safeExcerpt(nodes: Node[], preserveSources = false): string {
  return sanitizeHtml(nodes.map((node) => node.toString()).join(""), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "sup", "sub"],
    // Excerpts must not duplicate source anchors or interactive glossary attributes.
    allowedAttributes: {
      "*": preserveSources ? ["data-notice-source"] : [],
      a: ["href", "title"],
      th: ["colspan", "rowspan", "scope", "abbr"],
      td: ["colspan", "rowspan"],
      ol: ["start", "reversed", "type"],
      li: ["value"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      p: (tagName, attribs) => {
        const legacy = /\bAmmNoticeTitre([1-6])\b/.exec(attribs.class ?? "");
        return {
          tagName: legacy ? `h${Math.min(6, Number(legacy[1]) + 1)}` : tagName,
          attribs,
        };
      },
    },
  });
}

/** Keep inline formatting while slicing only at server-issued sentence boundaries.
 * Offsets count decoded text, so entities and words spanning tags remain intact.
 */
function sentenceHtml(
  element: HTMLElement,
  start: number,
  end: number,
): string {
  let offset = 0;
  function slice(node: Node): string {
    if (node instanceof TextNode) {
      const text = node.textContent;
      const from = Math.max(0, start - offset);
      const to = Math.min(text.length, end - offset);
      offset += text.length;
      return to > from
        ? text
            .slice(from, to)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
        : "";
    }
    if (!(node instanceof HTMLElement)) return "";
    if (node.tagName === "BR")
      return offset > start && offset < end ? "<br>" : "";
    const content = node.childNodes.map(slice).join("");
    if (!content) return "";
    const copy = node.clone() as HTMLElement;
    copy.set_content(content);
    return copy.toString();
  }
  return slice(element);
}

/** The model sees all source units in context but may select only these quotes.
 * Lists retain their lead-in and tables stay atomic: neither a bare bullet nor
 * an unlabeled table cell can become a purported standalone answer.
 */
function prepareQuotes(
  html: string,
  passageId: string,
  sourceBlocks: Map<
    string,
    { element: HTMLElement; target: NoticeSourceTarget }
  >,
): NoticeQuote[] {
  const root = parse(html);
  const quotes: NoticeQuote[] = [];
  const connectedGroups: {
    html: string;
    headingPath: string[];
    supersedes: string[];
    sourceRange: { start: number; end: number };
    listSource: NonNullable<NoticeQuote["listSource"]>;
  }[] = [];
  const headings: { level: number; text: string }[] = [];
  let previousParagraph: HTMLElement | undefined;
  let position = 0;
  let previousParagraphStart: number | undefined;
  const add = (
    quoteHtml: string,
    headingPath = headings.map((heading) => heading.text),
    sourceRange?: { start: number; end: number },
  ) => {
    const range = sourceRange ?? { start: position, end: position + 1 };
    if (!sourceRange) position += 1;
    if (!parse(quoteHtml).textContent.trim()) return;
    const excerpt = parse(quoteHtml);
    const sources: NoticeQuoteSource[] = [];
    let primaryTarget: NoticeSourceTarget | undefined;
    let primaryIsContent = false;
    for (const element of excerpt.querySelectorAll("[data-notice-source]")) {
      if (!["P", "LI", "TABLE", "OL"].includes(element.tagName)) continue;
      let parent = element.parentNode;
      let nested = false;
      while (parent && parent !== excerpt) {
        if (
          parent instanceof HTMLElement &&
          ["LI", "TABLE", "OL"].includes(parent.tagName)
        )
          nested = true;
        parent = parent.parentNode;
      }
      if (nested) continue;
      const source = sourceBlocks.get(
        element.getAttribute("data-notice-source")!,
      );
      if (!source) continue;
      const text = element.textContent;
      const start = source.element.textContent.indexOf(text);
      if (start < 0 || !text.trim()) continue;
      sources.push({ ...source.target, start, end: start + text.length });
      if (!primaryTarget || (!primaryIsContent && element.tagName !== "P")) {
        primaryTarget = source.target;
        primaryIsContent = element.tagName !== "P";
      }
    }
    const quote: NoticeQuote = {
      id: `${passageId}-quote-${quotes.length + 1}`,
      html: safeExcerpt(excerpt.childNodes),
      headingPath,
      sourceRange: range,
      ...(sources.length ? { sources, target: primaryTarget } : {}),
    };
    quotes.push(quote);
    return quote;
  };

  for (const node of root.childNodes.flatMap(flowNodes)) {
    if (!(node instanceof HTMLElement)) {
      if (node instanceof TextNode && node.textContent.trim()) {
        const paragraph = parse(`<p>${node.toString()}</p>`)
          .firstChild as HTMLElement;
        add(paragraph.toString());
        previousParagraph = undefined;
        previousParagraphStart = undefined;
      }
      continue;
    }
    const level = headingLevel(node);
    if (level !== undefined) {
      while (headings.length && headings[headings.length - 1].level >= level)
        headings.pop();
      headings.push({ level, text: node.textContent.trim() });
      previousParagraph = undefined;
      previousParagraphStart = undefined;
      position += 1;
    } else if (node.tagName === "UL") {
      // A list's preceding paragraph often supplies a negation or condition.
      const leadIn = previousParagraph?.toString() ?? "";
      const listId = node.hasAttribute("data-notice-source")
        ? `source-list-${node.getAttribute("data-notice-source")}`
        : `${passageId}-list-${position}`;
      const firstItem = node.children[0];
      const introductoryItemHtml =
        node.children.length > 1 && firstItem.textContent.trim().endsWith(":")
          ? firstItem.toString()
          : undefined;
      const introductionIds =
        previousParagraphStart === undefined
          ? []
          : quotes
              .filter(
                (quote) =>
                  quote.sourceRange &&
                  quote.sourceRange.start >= previousParagraphStart! &&
                  quote.sourceRange.end <= position,
              )
              .map((quote) => quote.id);
      const firstFragment = quotes.length;
      const fragments: (NoticeQuote | undefined)[] = [];
      const fragmentRanges: { start: number; end: number }[] = [];
      for (const [itemIndex, item] of node.children.entries()) {
        const list = node.clone() as HTMLElement;
        list.set_content(
          (itemIndex > 0 ? (introductoryItemHtml ?? "") : "") + item.toString(),
        );
        const start = previousParagraphStart ?? position;
        const fragment = add(leadIn + list.toString());
        if (fragment) {
          fragment.sourceRange!.start = start;
          fragment.listSource = {
            id: listId,
            itemStart: itemIndex,
            itemEnd: itemIndex + 1,
            introductionIds: [
              ...introductionIds,
              ...(itemIndex > 0 && introductoryItemHtml && fragments[0]
                ? [fragments[0].id]
                : []),
            ],
            introductoryItemHtml: introductoryItemHtml
              ? safeExcerpt(parse(introductoryItemHtml).childNodes)
              : undefined,
          };
        }
        fragments.push(fragment);
        fragmentRanges.push({ start, end: position });
      }
      // Offer connected bullets as one source unit as well. In particular,
      // "Cette dose..." cannot be understood independently of the previous dose.
      // Keep existing IDs stable by appending these alternatives after the scan.
      const items = node.children;
      for (let start = 0; start < items.length; ) {
        let end = start + 1;
        while (
          end < items.length &&
          /^(?:ce(?:tte|t|s)?\b|cela\b|ceci\b|dans ce cas\b|elles?\b|ils?\b)/iu.test(
            items[end].textContent.trim(),
          )
        )
          end += 1;
        if (end - start > 1) {
          const list = node.clone() as HTMLElement;
          list.set_content(
            (start > 0 ? (introductoryItemHtml ?? "") : "") +
              items
                .slice(start, end)
                .map((item) => item.toString())
                .join(""),
          );
          const supersedes = fragments
            .slice(start, end)
            .flatMap((quote) => (quote ? [quote.id] : []));
          const introduction = quotes
            .slice(0, firstFragment)
            .findLast(
              (quote) => quote.html === safeExcerpt(parse(leadIn).childNodes),
            );
          if (introduction) supersedes.push(introduction.id);
          connectedGroups.push({
            html: leadIn + list.toString(),
            headingPath: headings.map((heading) => heading.text),
            supersedes,
            sourceRange: {
              start: fragmentRanges[start].start,
              end: fragmentRanges[end - 1].end,
            },
            listSource: {
              id: listId,
              itemStart: start,
              itemEnd: end,
              introductionIds: [
                ...introductionIds,
                ...(start > 0 && introductoryItemHtml && fragments[0]
                  ? [fragments[0].id]
                  : []),
              ],
              introductoryItemHtml: introductoryItemHtml
                ? safeExcerpt(parse(introductoryItemHtml).childNodes)
                : undefined,
            },
          });
        }
        start = end;
      }
      previousParagraph = undefined;
      previousParagraphStart = undefined;
    } else if (node.tagName === "P" && !node.querySelector("img")) {
      const text = node.textContent;
      const paragraphStart = position;
      for (const sentence of sentenceSegmenter.segment(text)) {
        const start =
          sentence.index +
          sentence.segment.length -
          sentence.segment.trimStart().length;
        const end = sentence.index + sentence.segment.trimEnd().length;
        if (end > start) add(sentenceHtml(node, start, end));
      }
      previousParagraph = node;
      previousParagraphStart =
        position > paragraphStart ? paragraphStart : undefined;
    } else {
      // Keep tables whole, with captions and population/header cells. Their
      // surrounding prose remains separately selectable instead of making every
      // table quote include the entire preceding paragraph. Ordered instructions
      // still retain their introduction and complete sequence.
      const quote = add(
        (node.tagName === "OL" ? (previousParagraph?.toString() ?? "") : "") +
          node.toString(),
      );
      if (
        quote &&
        node.tagName === "OL" &&
        previousParagraphStart !== undefined
      )
        quote.sourceRange!.start = previousParagraphStart;
      previousParagraph = undefined;
      previousParagraphStart = undefined;
    }
  }
  connectedGroups.forEach((group) => {
    const quote = add(group.html, group.headingPath, group.sourceRange);
    if (quote) {
      quote.supersedes = group.supersedes;
      quote.listSource = group.listSource;
    }
  });
  const positions = new Map(quotes.map((quote, index) => [quote.id, index]));
  const sourcePosition = (quote: NoticeQuote) =>
    quote.supersedes?.length
      ? Math.min(...quote.supersedes.map((id) => positions.get(id)!))
      : positions.get(quote.id)!;
  return quotes.sort(
    (left, right) => sourcePosition(left) - sourcePosition(right),
  );
}

/** Present a connected answer block instead of its dependent fragments. */
export function getSelectableNoticeQuotes(
  passage: NoticePassage,
): NoticeQuote[] {
  const superseded = new Set(
    passage.quotes.flatMap((quote) => quote.supersedes ?? []),
  );
  return passage.quotes.filter((quote) => !superseded.has(quote.id));
}

/** Send readable source quotes once across overlapping passages. The full
 * passage HTML stays on the server; headings retain each quote's context.
 */
export function prepareNoticeSelectionInput(
  passages: NoticePassage[],
  question: string,
) {
  const seen = new Set<string>();
  const compactPassages = passages
    .map((passage) => ({
      id: passage.id,
      headingPath: passage.headingPath,
      quotes: getSelectableNoticeQuotes(passage).flatMap((quote) => {
        const key = JSON.stringify([quote.headingPath, quote.html]);
        if (seen.has(key)) return [];
        seen.add(key);
        return [
          {
            id: quote.id,
            html: quote.html,
            ...(JSON.stringify(quote.headingPath) ===
            JSON.stringify(passage.headingPath)
              ? {}
              : {
                  headingPath: quote.headingPath,
                }),
          },
        ];
      }),
    }))
    .filter((passage) => passage.quotes.length > 0);
  return { question, passages: compactPassages };
}

/** Sections include their whole subtree, never isolated sentences. Ancestor
 * introductions accompany children. Ambiguous bold headings stay in the broader section.
 */
export function prepareNoticePassages(contentHtml: string): {
  sourceVersion: string;
  passages: NoticePassage[];
} {
  const root = parse(contentHtml);
  const firstAnchors = new Map<string, HTMLElement>();
  for (const element of root.querySelectorAll("[id], [name]")) {
    for (const attribute of ["id", "name"]) {
      const anchor = element.getAttribute(attribute);
      if (anchor && !firstAnchors.has(anchor))
        firstAnchors.set(anchor, element);
    }
  }
  const sourceBlocks = new Map<
    string,
    { element: HTMLElement; target: NoticeSourceTarget }
  >();
  root.querySelectorAll(documentSourceSelector).forEach((element, index) => {
    const key = String(index);
    const ownAnchor =
      element.getAttribute("id") ?? element.getAttribute("name");
    const blockId = element.getAttribute("data-block-id");
    const target = {
      anchor:
        ownAnchor && firstAnchors.get(ownAnchor) === element
          ? ownAnchor
          : blockId
            ? getDocumentBlockAnchor(blockId)
            : getDocumentSourceAnchor(index),
      blockId,
    };
    sourceBlocks.set(key, {
      element,
      target: {
        ...target,
        anchor: target.anchor ?? getDocumentSourceAnchor(index),
      },
    });
    element.setAttribute("data-notice-source", key);
  });
  const documentSection: Section = { level: 0, intro: [], nodes: [] };
  const sections = [documentSection];
  const stack = [documentSection];

  for (const node of root.childNodes.flatMap(flowNodes)) {
    const level = node instanceof HTMLElement ? headingLevel(node) : undefined;
    if (level !== undefined) {
      while (stack.length > 1 && stack[stack.length - 1].level >= level)
        stack.pop();
      const parent = stack[stack.length - 1];
      const section: Section = {
        level,
        heading: node as HTMLElement,
        parent,
        intro: [],
        nodes: [],
      };
      sections.push(section);
      stack.push(section);
    } else {
      stack[stack.length - 1].intro.push(node);
    }
    for (const section of stack) section.nodes.push(node);
  }

  const passages: NoticePassage[] = [];
  for (const section of sections) {
    const ownContent =
      section === documentSection
        ? section.intro
        : section.nodes.filter((node) => node !== section.heading);
    if (
      !ownContent.some(
        (node) =>
          node.textContent.trim() ||
          (node instanceof HTMLElement &&
            (node.tagName === "IMG" || node.querySelector("img"))),
      )
    )
      continue;
    const ancestors: Section[] = [];
    for (let parent = section.parent; parent; parent = parent.parent)
      ancestors.unshift(parent);
    const prefix = ancestors.flatMap((parent) => [
      ...(parent.heading ? [parent.heading] : []),
      ...parent.intro,
    ]);
    const nodes = section === documentSection ? ownContent : section.nodes;
    const id = `passage-${passages.length + 1}`;
    const html = safeExcerpt([...prefix, ...nodes]);
    passages.push({
      id,
      headingPath: [...ancestors, section].flatMap((item) =>
        item.heading ? [item.heading.textContent.trim()] : [],
      ),
      html,
      target: sourceTarget(
        section.heading ? [section.heading, ...nodes] : nodes,
        firstAnchors,
      ),
      quotes: prepareQuotes(
        safeExcerpt([...prefix, ...nodes], true),
        id,
        sourceBlocks,
      ),
    });
  }

  return {
    sourceVersion: createHash("sha256").update(contentHtml).digest("hex"),
    passages,
  };
}

export function parseNoticeSelection(value: unknown): NoticeSelection {
  return selectionSchema.parse(value);
}

/** Only merge items proven to come from the same source list. Identical prose
 * in separate lists must keep its own condition and population context.
 */
function mergeSelectedListQuotes(quotes: NoticeQuote[]): NoticeQuote[] {
  const coveredIntroductions = new Set(
    quotes.flatMap((quote) => quote.listSource?.introductionIds ?? []),
  );
  const emittedLists = new Set<string>();
  return quotes.flatMap((quote) => {
    if (coveredIntroductions.has(quote.id)) return [];
    const source = quote.listSource;
    if (!source) return [quote];
    if (emittedLists.has(source.id)) return [];
    emittedLists.add(source.id);
    const selected = quotes
      .filter((candidate) => candidate.listSource?.id === source.id)
      .sort((a, b) => a.listSource!.itemStart - b.listSource!.itemStart);
    if (selected.length === 1) return [quote];
    const root = parse(selected[0].html);
    const list = root.children.find((element) => element.tagName === "UL")!;
    const emittedItems = new Set<number>();
    const items = selected.flatMap((item) =>
      parse(item.html)
        .children.find((element) => element.tagName === "UL")!
        .children.filter(
          (_child, index) =>
            !(
              index === 0 &&
              item.listSource!.itemStart > 0 &&
              item.listSource!.introductoryItemHtml
            ),
        )
        .flatMap((child, index) => {
          const sourceIndex = item.listSource!.itemStart + index;
          if (emittedItems.has(sourceIndex)) return [];
          emittedItems.add(sourceIndex);
          return [child.toString()];
        }),
    );
    list.set_content(
      (selected[0].listSource!.itemStart > 0
        ? (source.introductoryItemHtml ?? "")
        : "") + items.join(""),
    );
    return [
      {
        ...quote,
        html: root.toString(),
        sources: selected.flatMap((item) => item.sources ?? []),
        sourceRange: quote.sourceRange && {
          start: Math.min(...selected.map((item) => item.sourceRange!.start)),
          end: Math.max(...selected.map((item) => item.sourceRange!.end)),
        },
      },
    ];
  });
}

/** Reject the entire selection if any source ID is invalid. No model text is rendered. */
export function resolveNoticeSelection(
  passages: NoticePassage[],
  selection: NoticeSelection,
): NoticePassage[] {
  if (selection.status === "insufficient_evidence") return [];
  const selectedIds = new Map<string, Set<string>>();
  for (const item of selection.selections) {
    const passage = passages.find((passage) => passage.id === item.passage_id);
    if (!passage) throw new Error("Unknown notice passage");
    const ids = selectedIds.get(passage.id) ?? new Set<string>();
    for (const id of item.quote_ids) {
      if (!passage.quotes.some((quote) => quote.id === id))
        throw new Error("Unknown notice quote");
      ids.add(id);
    }
    selectedIds.set(passage.id, ids);
  }
  const seenQuotes = new Set<string>();
  const selected = passages.flatMap((passage) => {
    const ids = selectedIds.get(passage.id);
    if (!ids) return [];
    const quotes = passage.quotes.filter((quote) => {
      if (!ids.has(quote.id)) return false;
      const key = JSON.stringify([quote.headingPath, quote.html]);
      if (seenQuotes.has(key)) return false;
      seenQuotes.add(key);
      return true;
    });
    return quotes.length ? [{ ...passage, quotes }] : [];
  });
  // A connected source block already contains its exact fragments. Removing
  // those duplicate copies loses no text or condition from the selected answer.
  const superseded = new Set(
    selected.flatMap((passage) =>
      passage.quotes.flatMap((quote) => quote.supersedes ?? []),
    ),
  );
  // Merge shared source lists across overlapping parent/child passages as well.
  const merged = mergeSelectedListQuotes(
    selected.flatMap((passage) =>
      passage.quotes.filter((quote) => !superseded.has(quote.id)),
    ),
  );
  const candidates = merged.map((quote) => ({
    quote,
    text: parse(quote.html).textContent.replace(/\s+/gu, " ").trim(),
    // Numbered top-level leaflet sections do not change the population scope.
    // Keep every local heading (e.g. adults/children) when comparing duplicates.
    scope: quote.headingPath.filter(
      (heading, index) => index !== 0 || !/^[1-6]\.\s/u.test(heading),
    ),
  }));
  const retained = new Set(
    candidates
      .filter(
        (candidate, index) =>
          !candidates.some((other, otherIndex) => {
            if (index === otherIndex) return false;
            const sameContext =
              JSON.stringify(candidate.scope) === JSON.stringify(other.scope);
            const sameSource =
              candidate.quote.sources?.length &&
              candidate.quote.sources.every((source) =>
                other.quote.sources?.some(
                  (cover) =>
                    cover.anchor === source.anchor &&
                    cover.start <= source.start &&
                    cover.end >= source.end,
                ),
              );
            // Remove only proven coverage, never a semantic guess about a warning.
            return (
              (sameContext || sameSource) &&
              other.text.includes(candidate.text) &&
              (other.text.length > candidate.text.length || otherIndex < index)
            );
          }),
      )
      .map(({ quote }) => quote.id),
  );
  const compact = selected
    .map((passage) => ({
      ...passage,
      quotes: merged.filter(
        (quote) =>
          retained.has(quote.id) &&
          passage.quotes.some((original) => original.id === quote.id),
      ),
    }))
    .filter((passage) => passage.quotes.length > 0);
  return compact;
}
