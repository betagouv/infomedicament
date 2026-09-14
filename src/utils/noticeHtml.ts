import { parse } from "node-html-parser";

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

    const elements = [element];
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
