import { parse } from "node-html-parser";
import type { Definition } from "@/types/GlossaireTypes";

// Run while preparing server data, so definition triggers are accessible in SSR.
export function prepareGlossaryHtml(
  contentHtml: string,
  definitions: Definition[],
): string {
  if (!contentHtml.includes("data-definition") || definitions.length === 0)
    return contentHtml;
  const names = new Set(definitions.map((definition) => definition.nom));
  const root = parse(contentHtml);
  root.querySelectorAll("[data-definition]").forEach((element) => {
    const name = element.getAttribute("data-definition");
    if (!name || !names.has(name)) return;
    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.setAttribute("aria-haspopup", "dialog");
    element.setAttribute(
      "aria-label",
      `Voir la définition de ${element.textContent.trim() || name}`,
    );
  });
  return root.toString();
}
