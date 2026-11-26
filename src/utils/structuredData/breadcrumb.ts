import { SITE_NAME, StructuredData } from "./index";

// Page of the breadcrumb: name and path on the site
export type BreadcrumbPage = { name: string; path: string };

// Sections of the URLs, named as in the menu of the site (ClientHeader)
const BREADCRUMB_SECTIONS: BreadcrumbPage[] = [
  { name: "Tous les médicaments", path: "/medicaments" },
  { name: "Toutes les substances actives", path: "/substances" },
  { name: "Toutes les indications", path: "/indications" },
  { name: "Toutes les classes de médicament", path: "/atc" },
  { name: "Tous les groupes génériques", path: "/generiques" },
  { name: "Vos questions", path: "/articles" },
];

/**
 * Breadcrumb of the page: https://schema.org/BreadcrumbList
 * From the URL of the page (not the DSFR Breadcrumb displayed):
 * home, then the section of the URL if any (e.g. "/substances" for "/substances/paracetamol-02202"),
 * then the parents of the page in its URL if any (e.g. the medicament of "/medicaments/doliprane-…/details"),
 * then the page itself
 * page: canonical path of the page, e.g. "/substances/paracetamol-02202", and its name, e.g. its title
 */
export function getBreadcrumbStructuredData(
  page: BreadcrumbPage,
  baseUrl: string,
  parents: BreadcrumbPage[] = [],
): StructuredData {
  const section = BREADCRUMB_SECTIONS.find((section) =>
    page.path.startsWith(`${section.path}/`),
  );
  const items: BreadcrumbPage[] = [
    { name: SITE_NAME, path: "/" },
    ...(section ? [section] : []),
    ...parents,
    page,
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name.trim(),
      item: `${baseUrl}${item.path}`,
    })),
  };
}
