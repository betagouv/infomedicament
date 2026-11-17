import "server-only";

import { createHash } from "node:crypto";
import { HTMLElement, Node, TextNode, parse } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import type { NoticePassage, NoticeQuote, NoticeSourceTarget } from "@/types/NoticeSearch";
import { getDocumentBlockAnchor } from "@/utils/documentSourceAnchors";

interface Section {
  level: number;
  heading?: HTMLElement;
  parent?: Section;
  intro: Node[];
  nodes: Node[];
}

const selectionSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("supported"),
    selections: z.array(z.object({
      passage_id: z.string().min(1),
      quote_ids: z.array(z.string().min(1)).min(1),
    }).strict()).min(1),
  }).strict(),
  z.object({
    status: z.literal("insufficient_evidence"),
    selections: z.array(z.never()).length(0),
  }).strict(),
]);

export type NoticeSelection = z.infer<typeof selectionSchema>;

// Derive generation constraints from the same schema used to validate responses.
export const noticeSelectionJsonSchema = z.toJSONSchema(selectionSchema, { target: "draft-7" });

const sentenceSegmenter = new Intl.Segmenter("fr", { granularity: "sentence" });

function headingLevel(element: HTMLElement): number | undefined {
  const heading = /^H([1-6])$/.exec(element.tagName);
  if (heading) return Number(heading[1]);
  const legacy = /\bAmmNoticeTitre([1-6])\b/.exec(element.getAttribute("class") ?? "");
  return legacy ? Number(legacy[1]) + 1 : undefined;
}

// Flatten layout wrappers, never medical structures such as tables, lists or figures.
function flowNodes(node: Node): Node[] {
  if (node instanceof HTMLElement && /^(HTML|BODY|MAIN|ARTICLE|SECTION|DIV)$/.test(node.tagName)) {
    return node.childNodes.flatMap(flowNodes);
  }
  return [node];
}

function sourceTarget(nodes: Node[], firstAnchors: Map<string, HTMLElement>): NoticeSourceTarget {
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    const anchorElement = node.hasAttribute("id") || node.hasAttribute("name") ? node : node.querySelector("[id], [name]");
    const anchor = anchorElement?.getAttribute("id") ?? anchorElement?.getAttribute("name");
    const blockId = node.getAttribute("data-block-id");
    if (anchor || blockId) return {
      anchor: blockId && (!anchor || firstAnchors.get(anchor) !== anchorElement) ? getDocumentBlockAnchor(blockId) : anchor,
      blockId,
    };
  }
  return {};
}

function safeExcerpt(nodes: Node[]): string {
  return sanitizeHtml(nodes.map((node) => node.toString()).join(""), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "sup", "sub"],
    // Excerpts must not duplicate source anchors or interactive glossary attributes.
    allowedAttributes: {
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
        return { tagName: legacy ? `h${Math.min(6, Number(legacy[1]) + 1)}` : tagName, attribs };
      },
    },
  });
}

/** Keep inline formatting while slicing only at server-issued sentence boundaries.
 * Offsets count decoded text, so entities and words spanning tags remain intact.
 */
function sentenceHtml(element: HTMLElement, start: number, end: number): string {
  let offset = 0;
  function slice(node: Node): string {
    if (node instanceof TextNode) {
      const text = node.textContent;
      const from = Math.max(0, start - offset);
      const to = Math.min(text.length, end - offset);
      offset += text.length;
      return to > from ? text.slice(from, to).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
    }
    if (!(node instanceof HTMLElement)) return "";
    if (node.tagName === "BR") return offset > start && offset < end ? "<br>" : "";
    const content = node.childNodes.map(slice).join("");
    if (!content) return "";
    const copy = node.clone() as HTMLElement;
    copy.set_content(content);
    return copy.toString();
  }
  return slice(element);
}

/** The model sees whole sections but may select only these exact source units.
 * Lists retain their lead-in and tables stay atomic: neither a bare bullet nor
 * an unlabeled table cell can become a purported standalone answer.
 */
function prepareQuotes(html: string, passageId: string): NoticeQuote[] {
  const root = parse(html);
  const quotes: NoticeQuote[] = [];
  const connectedGroups: { html: string; headingPath: string[]; supersedes: string[] }[] = [];
  const headings: { level: number; text: string }[] = [];
  let previousParagraph: HTMLElement | undefined;
  const add = (quoteHtml: string, headingPath = headings.map((heading) => heading.text)) => {
    if (!parse(quoteHtml).textContent.trim()) return;
    quotes.push({
      id: `${passageId}-quote-${quotes.length + 1}`,
      html: quoteHtml,
      headingPath,
    });
  };

  for (const node of root.childNodes.flatMap(flowNodes)) {
    if (!(node instanceof HTMLElement)) {
      if (node instanceof TextNode && node.textContent.trim()) {
        const paragraph = parse(`<p>${node.toString()}</p>`).firstChild as HTMLElement;
        add(paragraph.toString());
        previousParagraph = undefined;
      }
      continue;
    }
    const level = headingLevel(node);
    if (level !== undefined) {
      while (headings.length && headings[headings.length - 1].level >= level) headings.pop();
      headings.push({ level, text: node.textContent.trim() });
      previousParagraph = undefined;
    } else if (node.tagName === "UL") {
      // A list's preceding paragraph often supplies a negation or condition.
      const leadIn = previousParagraph?.toString() ?? "";
      const firstFragment = quotes.length;
      for (const item of node.children) {
        const list = node.clone() as HTMLElement;
        list.set_content(item.toString());
        add(leadIn + list.toString());
      }
      // Offer connected bullets as one source unit as well. In particular,
      // "Cette dose..." cannot be understood independently of the previous dose.
      // Keep existing IDs stable by appending these alternatives after the scan.
      const items = node.children;
      for (let start = 0; start < items.length;) {
        let end = start + 1;
        while (end < items.length && /^(?:ce(?:tte|t|s)?\b|cela\b|ceci\b|dans ce cas\b|elles?\b|ils?\b)/iu.test(items[end].textContent.trim())) end += 1;
        if (end - start > 1) {
          const list = node.clone() as HTMLElement;
          list.set_content(items.slice(start, end).map((item) => item.toString()).join(""));
          const supersedes = quotes.slice(firstFragment + start, firstFragment + end).map((quote) => quote.id);
          const introduction = quotes.slice(0, firstFragment).findLast((quote) => quote.html === leadIn);
          if (introduction) supersedes.push(introduction.id);
          connectedGroups.push({ html: leadIn + list.toString(), headingPath: headings.map((heading) => heading.text), supersedes });
        }
        start = end;
      }
      previousParagraph = undefined;
    } else if (node.tagName === "P" && !node.querySelector("img")) {
      const text = node.textContent;
      for (const sentence of sentenceSegmenter.segment(text)) {
        const start = sentence.index + sentence.segment.length - sentence.segment.trimStart().length;
        const end = sentence.index + sentence.segment.trimEnd().length;
        if (end > start) add(sentenceHtml(node, start, end));
      }
      previousParagraph = node;
    } else {
      // Keep tables whole, with captions and population/header cells. Their
      // surrounding prose remains separately selectable instead of making every
      // table quote include the entire preceding paragraph. Ordered instructions
      // still retain their introduction and complete sequence.
      add((node.tagName === "OL" ? previousParagraph?.toString() ?? "" : "") + node.toString());
      previousParagraph = undefined;
    }
  }
  connectedGroups.forEach((group) => {
    add(group.html, group.headingPath);
    quotes[quotes.length - 1].supersedes = group.supersedes;
  });
  const positions = new Map(quotes.map((quote, index) => [quote.id, index]));
  const sourcePosition = (quote: NoticeQuote) => quote.supersedes?.length
    ? Math.min(...quote.supersedes.map((id) => positions.get(id)!))
    : positions.get(quote.id)!;
  return quotes.sort((left, right) => sourcePosition(left) - sourcePosition(right));
}

/** Present a connected answer block instead of its dependent fragments. */
export function getSelectableNoticeQuotes(passage: NoticePassage): NoticeQuote[] {
  const superseded = new Set(passage.quotes.flatMap((quote) => quote.supersedes ?? []));
  return passage.quotes.filter((quote) => !superseded.has(quote.id));
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
      if (anchor && !firstAnchors.has(anchor)) firstAnchors.set(anchor, element);
    }
  }
  const documentSection: Section = { level: 0, intro: [], nodes: [] };
  const sections = [documentSection];
  const stack = [documentSection];

  for (const node of root.childNodes.flatMap(flowNodes)) {
    const level = node instanceof HTMLElement ? headingLevel(node) : undefined;
    if (level !== undefined) {
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      const parent = stack[stack.length - 1];
      const section: Section = { level, heading: node as HTMLElement, parent, intro: [], nodes: [] };
      sections.push(section);
      stack.push(section);
    } else {
      stack[stack.length - 1].intro.push(node);
    }
    for (const section of stack) section.nodes.push(node);
  }

  const passages: NoticePassage[] = [];
  for (const section of sections) {
    const ownContent = section === documentSection ? section.intro : section.nodes.filter((node) => node !== section.heading);
    if (!ownContent.some((node) => node.textContent.trim() || (node instanceof HTMLElement && (node.tagName === "IMG" || node.querySelector("img"))))) continue;
    const ancestors: Section[] = [];
    for (let parent = section.parent; parent; parent = parent.parent) ancestors.unshift(parent);
    const prefix = ancestors.flatMap((parent) => [
      ...(parent.heading ? [parent.heading] : []), ...parent.intro,
    ]);
    const nodes = section === documentSection ? ownContent : section.nodes;
    const id = `passage-${passages.length + 1}`;
    const html = safeExcerpt([...prefix, ...nodes]);
    passages.push({
      id,
      headingPath: [...ancestors, section].flatMap((item) => item.heading ? [item.heading.textContent.trim()] : []),
      html,
      target: sourceTarget(section.heading ? [section.heading, ...nodes] : nodes, firstAnchors),
      quotes: prepareQuotes(html, id),
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

/** Reject the entire selection if any source ID is invalid. No model text is rendered. */
export function resolveNoticeSelection(passages: NoticePassage[], selection: NoticeSelection): NoticePassage[] {
  if (selection.status === "insufficient_evidence") return [];
  const selectedIds = new Map<string, Set<string>>();
  for (const item of selection.selections) {
    const passage = passages.find((passage) => passage.id === item.passage_id);
    if (!passage) throw new Error("Unknown notice passage");
    const ids = selectedIds.get(passage.id) ?? new Set<string>();
    for (const id of item.quote_ids) {
      if (!passage.quotes.some((quote) => quote.id === id)) throw new Error("Unknown notice quote");
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
  const superseded = new Set(selected.flatMap((passage) => passage.quotes.flatMap((quote) => quote.supersedes ?? [])));
  const compact = selected.map((passage) => ({ ...passage, quotes: passage.quotes.filter((quote) => !superseded.has(quote.id)) }))
    .filter((passage) => passage.quotes.length > 0);
  return compact;
}
