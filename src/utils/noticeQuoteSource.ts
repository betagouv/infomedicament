import type { NoticeQuote, NoticeSourceTarget } from "@/types/NoticeSearch";

function findSource(notice: HTMLElement, target: NoticeSourceTarget) {
  const elements = Array.from(
    notice.querySelectorAll<HTMLElement>("[id], [name], [data-block-id]"),
  );
  return (
    elements.find(
      (element) => target.blockId && element.dataset.blockId === target.blockId,
    ) ??
    elements.find(
      (element) =>
        target.anchor &&
        (element.id === target.anchor ||
          element.getAttribute("name") === target.anchor),
    )
  );
}

export function clearNoticeQuoteHighlights(elements: HTMLElement[]) {
  for (const element of elements) {
    if (element.hasAttribute("data-notice-highlight")) {
      const parent = element.parentNode;
      element.replaceWith(...element.childNodes);
      parent?.normalize();
    } else {
      element.classList.remove("notice-highlight");
    }
  }
}

/** Mark only the original text ranges, preserving inline glossary elements. */
export function highlightNoticeQuote(
  notice: HTMLElement,
  quote: NoticeQuote,
  fallback: NoticeSourceTarget,
) {
  clearNoticeQuoteHighlights(
    Array.from(
      notice.querySelectorAll<HTMLElement>(
        "[data-notice-highlight], .notice-highlight",
      ),
    ),
  );
  const marks: HTMLElement[] = [];
  const ranges = new Map<HTMLElement, { start: number; end: number }[]>();
  for (const source of quote.sources ?? []) {
    const element = findSource(notice, source);
    if (!element) continue;
    const list = ranges.get(element) ?? [];
    list.push({ start: source.start, end: source.end });
    ranges.set(element, list);
  }
  const target = findSource(notice, quote.target ?? fallback);
  let scrollTarget: HTMLElement | undefined;
  for (const [element, offsets] of ranges) {
    const merged: { start: number; end: number }[] = [];
    for (const range of offsets.sort((a, b) => a.start - b.start)) {
      const previous = merged.at(-1);
      if (previous && range.start <= previous.end)
        previous.end = Math.max(previous.end, range.end);
      else merged.push({ ...range });
    }
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; start: number; end: number }[] = [];
    let offset = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      nodes.push({ node, start: offset, end: offset + node.length });
      offset += node.length;
    }
    // Process backwards so splitting a text node cannot invalidate later offsets.
    for (const range of merged.toReversed()) {
      for (const item of nodes.toReversed()) {
        const start = Math.max(range.start, item.start) - item.start;
        const end = Math.min(range.end, item.end) - item.start;
        if (end <= start) continue;
        const text = item.node.splitText(start);
        text.splitText(end - start);
        const mark = document.createElement("mark");
        mark.className = "notice-highlight-quote";
        mark.setAttribute("data-notice-highlight", "");
        text.replaceWith(mark);
        mark.append(text);
        marks.unshift(mark);
        if (element === target) scrollTarget = mark;
      }
    }
  }
  if (!marks.length && target) {
    target.classList.add("notice-highlight");
    marks.push(target);
  }
  return {
    highlights: marks,
    scrollTarget: scrollTarget ?? marks[0] ?? target,
  };
}
