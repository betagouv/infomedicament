import type { Article, ArticleLinkedEntity } from "@/types/ArticlesTypes";
import { getPublisher, getWebSiteId, SITE_DOMAIN, SPATIAL_COVERAGE, StructuredData } from "./index";
import { getDrugId } from "./drug";

// Source of the articles written by Info Médicament (ref_articles.source)
const SITE_SOURCE = SITE_DOMAIN;

// Path of the cover of an article (public folder)
export const getArticleCoverPath = (image: string): string => `/img/article_covers/${image}.webp`;

// Number of words of the text of a Markdown content (articles): without the Markdown syntax, the HTML tags and the URLs
export function countWords(markdown: string): number {
  const text = markdown
    // HTML tags with their content for the scripts and styles (e.g. embedded widget)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // Images and links: only their text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    // Markdown syntax (titles, quotes, emphasis, lists, tables...)
    .replace(/[#>*_`|~]/g, " ")
    .replace(/^\s*[-+]\s/gm, " ");
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

// Maximum number of substances / medicaments mentioned: the main ones (substances first),
// a long list (e.g. 199 for "Médicaments et soleil") no longer says what the article is about
export const MAX_MENTIONS = 20;

// Medicaments: with the identifier of their Drug, the same entity as on their page (and its subjectOf)
const toEntity = (entity: ArticleLinkedEntity, baseUrl: string): StructuredData => {
  const url = `${baseUrl}${entity.path}`;
  return {
    "@type": entity.type,
    ...(entity.type === "Drug" && entity.path.startsWith("/medicaments/") ? { "@id": getDrugId(url) } : {}),
    name: entity.name,
    url,
  };
};

/**
 * Article page: https://schema.org/Article
 * No datePublished / dateModified: the articles have no date (ref_articles)
 * options.imageSize: size of the cover, image as an ImageObject with its size if known
 * options.about / options.mentions: pages of the site linked to the article (see getArticleLinkedEntities)
 */
export function getArticleStructuredData(
  article: Pick<Article, "slug" | "title" | "description" | "category" | "source" | "canonicalUrl" | "image" | "content">,
  baseUrl: string,
  options: {
    imageSize?: { width: number, height: number },
    about?: ArticleLinkedEntity[],
    mentions?: ArticleLinkedEntity[],
  } = {},
): StructuredData {
  const url = `${baseUrl}/articles/${article.slug}`;
  const publisher = getPublisher(baseUrl);
  const source = article.source?.trim();
  const sourceUrl = article.canonicalUrl?.trim();
  const imageUrl = article.image ? `${baseUrl}${getArticleCoverPath(article.image)}` : undefined;
  const wordCount = article.content ? countWords(article.content) : 0;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    ...(article.description?.trim() ? { description: article.description.trim() } : {}),
    url,
    // Medical information page for the general public, part of the site (later: lastReviewed, reviewedBy)
    mainEntityOfPage: {
      "@type": "MedicalWebPage",
      "@id": url,
      audience: { "@type": "Patient" },
      isPartOf: { "@id": getWebSiteId(baseUrl) },
    },
    ...(imageUrl
      ? { image: options.imageSize ? { "@type": "ImageObject", url: imageUrl, ...options.imageSize } : imageUrl }
      : {}),
    ...(article.category?.trim() ? { articleSection: article.category.trim() } : {}),
    ...(wordCount > 0 ? { wordCount } : {}),
    inLanguage: "fr-FR",
    // The content applies to France (medicaments, rules)
    spatialCoverage: SPATIAL_COVERAGE,
    isAccessibleForFree: true,
    // Author: always Info Médicament, the source is in isBasedOn
    author: publisher,
    publisher,
    // External page the article is based on, with the organization of the source (e.g. "ANSM", "Santé.fr")
    ...(sourceUrl
      ? {
        isBasedOn: {
          "@type": "WebPage",
          url: sourceUrl,
          ...(source && source !== SITE_SOURCE ? { publisher: { "@type": "Organization", name: source } } : {}),
        },
      }
      : {}),
    // Subjects of the article (indications, ATC classes) and substances / medicaments mentioned
    ...(options.about?.length ? { about: options.about.map((entity) => toEntity(entity, baseUrl)) } : {}),
    ...(options.mentions?.length
      ? { mentions: options.mentions.slice(0, MAX_MENTIONS).map((entity) => toEntity(entity, baseUrl)) }
      : {}),
  };
}
