import { HTMLElement, NodeType, parse, TextNode } from "node-html-parser";

function getHeadingLevel(tagName: string): number | undefined {
  const match = /^H([1-6])$/.exec(tagName);
  return match ? Number(match[1]) : undefined;
}

export function getIndicationsBlock(contentHtml: string): string | undefined {
  if (!contentHtml) return undefined;

  const root = parse(contentHtml);
  const markedElements = root.querySelectorAll(
    '[data-document-role="indication"]',
  );

  if (markedElements.length === 0) return undefined;

  const sectionElements = markedElements.flatMap((element) => {
    const headingLevel = getHeadingLevel(element.tagName);
    if (!headingLevel) return [element];

    const elements = [];
    let sibling = element.nextElementSibling;

    while (sibling) {
      const siblingHeadingLevel = getHeadingLevel(sibling.tagName);
      if (siblingHeadingLevel && siblingHeadingLevel <= headingLevel) break;

      elements.push(sibling);
      sibling = sibling.nextElementSibling;
    }

    return elements;
  });

  return [...new Set(sectionElements)]
    .map((element) => element.toString())
    .join("");
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Cuts an HTML fragment after `maxChars` characters of text (on a word
 * boundary), keeping the markup of what remains. Returns undefined when the
 * text already fits, so callers can tell nothing was cut.
 */
export function truncateHtml(html: string, maxChars: number): string | undefined {
  if (!html) return undefined;

  const root = parse(html);
  let remaining = maxChars;
  let truncated = false;

  const walk = (element: HTMLElement) => {
    for (const child of [...element.childNodes]) {
      if (truncated) {
        child.remove();
        continue;
      }
      if (child.nodeType === NodeType.TEXT_NODE) {
        const text = child.text;
        if (!text.trim()) continue;
        if (text.length <= remaining) {
          remaining -= text.length;
          continue;
        }
        let cut = text.slice(0, remaining);
        const lastSpace = cut.search(/\s\S*$/);
        if (lastSpace > 0) cut = cut.slice(0, lastSpace);
        (child as TextNode).rawText = `${escapeText(cut.trimEnd())}…`;
        truncated = true;
      } else if (child.nodeType === NodeType.ELEMENT_NODE) {
        walk(child as HTMLElement);
      }
    }
  };

  walk(root);
  return truncated ? root.toString() : undefined;
}
