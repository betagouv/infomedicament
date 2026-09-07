import { parse } from "node-html-parser";

export function getIndicationsBlock(contentHtml: string): string | undefined {
  if (!contentHtml) return undefined;

  const root = parse(contentHtml);
  const section = root.querySelectorAll(
    '[data-document-role="indication"]',
  );

  return section.length > 0
    ? section.map((element) => element.toString()).join("")
    : undefined;
}
