import { HTMLElement, parse } from "node-html-parser";

/**
 * Level of a RCP section title: a heading (h1-h6), or an ANSM title paragraph
 * (class "AmmAnnexeTitre1", "AmmAnnexeTitre2"…) as in the documents of the BDPM.
 */
function getTitleLevel(element: HTMLElement): number | undefined {
  const headingMatch = /^H([1-6])$/.exec(element.tagName);
  if (headingMatch) return Number(headingMatch[1]);

  const classMatch = /\bAmmAnnexeTitre(\d)\b/.exec(element.getAttribute("class") ?? "");
  return classMatch ? Number(classMatch[1]) : undefined;
}

// Some ANSM titles have no anchor (e.g. <p class=AmmAnnexeTitre2>4.5. Interactions…</p>):
// find the title starting with the section number instead
function findTitleByNumber(root: HTMLElement, sectionNumber: string): HTMLElement | undefined {
  const numberPattern = new RegExp(`^${sectionNumber.replace(/\./g, "\\.")}\\.?(\\s|$)`);
  return root
    .querySelectorAll("*")
    .find((element) => getTitleLevel(element) !== undefined && numberPattern.test(element.textContent.trim()));
}

/**
 * Extracts a RCP section by the anchor set on its title (e.g. "RcpContreindications"
 * for rubrique 4.3), matching the same anchors used by DetailedSubMenu.tsx to scroll to a section,
 * plus every sibling until the next title of equal or higher level.
 * The anchor can be an id or a name, on the title itself or on an element inside it
 * (e.g. <p class="AmmAnnexeTitre2"><a name="RcpContreindications">4.3. …</a></p>).
 */
export function getRcpSectionBlock(
  contentHtml: string,
  anchorId: string,
  sectionNumber?: string,
): string | undefined {
  if (!contentHtml) return undefined;

  const root = parse(contentHtml);
  const anchor = root.querySelector(`[id="${anchorId}"]`)
    ?? root.querySelector(`[name="${anchorId}"]`)
    ?? (sectionNumber ? findTitleByNumber(root, sectionNumber) : undefined);
  if (!anchor) return undefined;

  // The section title is the anchor or its closest title ancestor
  let title: HTMLElement | null = anchor;
  while (title && getTitleLevel(title) === undefined) title = title.parentNode;
  if (!title) return anchor.toString();

  const titleLevel = getTitleLevel(title)!;
  const elements = [title];
  let sibling = title.nextElementSibling;

  while (sibling) {
    const siblingTitleLevel = getTitleLevel(sibling);
    if (siblingTitleLevel && siblingTitleLevel <= titleLevel) break;

    elements.push(sibling);
    sibling = sibling.nextElementSibling;
  }

  return elements.map((element) => element.toString()).join("");
}

export function getRcpSectionText(contentHtml: string, anchorId: string, sectionNumber?: string): string {
  const block = getRcpSectionBlock(contentHtml, anchorId, sectionNumber);
  if (!block) return "";
  // Separate the paragraphs: textContent would stick the end of one to the start of the next
  return parse(block).childNodes
    .map((node) => node.textContent)
    .join(" ")
    .trim()
    .replace(/\s+/g, " ");
}
