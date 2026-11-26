import { parse } from "node-html-parser";

// Structured data (JSON-LD) of the pages, see https://schema.org
export type StructuredData = Record<string, unknown>;

// Name of the site, publisher of the pages
export const SITE_NAME = "Info Médicament";
// Domain of the site, also its other name
export const SITE_DOMAIN = "infomedicament.beta.gouv.fr";
// Logo of the site (public folder)
export const SITE_LOGO = "/img/logo.svg";

// Country of the medicaments and of the rules described on the site
export const SPATIAL_COVERAGE: StructuredData = { "@type": "Country", name: "France" };

// Sections of the site (medicaments data): name and path of their list
export const SITE_SECTIONS: { name: string, path: string }[] = [
  { name: "Médicaments", path: "/medicaments" },
  { name: "Substances actives", path: "/substances" },
  { name: "Indications", path: "/indications" },
  { name: "Classes de médicaments (ATC)", path: "/atc" },
  { name: "Médicaments génériques", path: "/generiques" },
];

// Identifiers of the site (WebSite on the homepage) and of Info Médicament (Organization),
// the same on all the pages so the search engines know they are the same entities
export const getWebSiteId = (baseUrl: string): string => `${baseUrl}/#website`;
export const getOrganizationId = (baseUrl: string): string => `${baseUrl}/#organization`;

// ANSM, parent organization of Info Médicament and authority of the medicaments
export const ANSM: StructuredData = {
  "@type": "GovernmentOrganization",
  name: "ANSM",
  alternateName: "Agence nationale de sécurité du médicament et des produits de santé",
  url: "https://ansm.sante.fr",
};

// Publisher of the pages: Info Médicament, with its logo, service of the ANSM
export const getPublisher = (baseUrl: string): StructuredData => ({
  "@type": "Organization",
  "@id": getOrganizationId(baseUrl),
  name: SITE_NAME,
  url: baseUrl,
  logo: { "@type": "ImageObject", url: `${baseUrl}${SITE_LOGO}` },
  parentOrganization: ANSM,
});

// Text of an HTML content (definition, notice section, article): parsed with an HTML parser (not regexps),
// without the scripts and styles, the tags removed, entities decoded, spaces collapsed
export function htmlToText(html: string): string {
  const root = parse(html);
  root.querySelectorAll("script, style").forEach((element) => element.remove());
  return root.structuredText.replace(/\s+/g, " ").trim();
}

// JSON-LD content of a <script type="application/ld+json">: "<" escaped so the content cannot close the script
export function toJsonLd(data: StructuredData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
