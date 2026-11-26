"use server";

import "server-only";
import db from "@/db/";
import slugify from "slugify";
import { SearchArticlesFilters, SearchResultItem } from "@/types/SearchTypes";
import { Article, ArticleCardResume, ArticleLinkedEntity } from "@/types/ArticlesTypes";
import type { RefArticles } from "@/db/types";
import { getAtc } from "@/db/utils/atc";
import { getSubstancesTitles } from "@/db/utils/substances";
import { VISIBLE_SPECIALITE_AVAILABILITIES } from "@/db/utils/specialiteCatalog";
import { formatSpecName } from "@/displayUtils";
import { getAtcSlug } from "@/utils/atc";
import { getIndicationSlug } from "@/utils/indications";
import { getSpecSlug } from "@/utils/specialites";
import { getSubstanceSlug } from "@/utils/substances";

export async function getArticles(): Promise<Article[]> {
  "use cache: remote";

  const rows = await db
    .selectFrom("ref_articles")
    .select([
      "titre",
      "source",
      "contenu",
      "theme",
      "lien",
      "metadescription",
      "homepage",
      "image",
      "substances",
      "specialites",
      "pathologies",
      "atc_classe",
    ])
    .execute();

  return rows.map((row) => {
    return {
      slug: slugify(row.titre as string, { lower: true, strict: true }),
      title: row.titre as string,
      source: row.source as string,
      content: row.contenu as string,
      category: row.theme as string,
      homepage: row.homepage as boolean,
      canonicalUrl: row.lien as string,
      description: row.metadescription as string,
      ...(row.image ? { image: row.image as string } : {}),
      substances: parseArticleIds(row.substances),
      specialites: parseArticleIds(row.specialites),
      pathologies: parseArticleIds(row.pathologies),
      atc: parseArticleIds(row.atc_classe),
    };
  });
}

function parseArticleIds(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

type ArticleCardRow = Pick<
  RefArticles,
  | "titre"
  | "lien"
  | "metadescription"
  | "substances"
  | "specialites"
  | "pathologies"
  | "atc_classe"
>;

function mapArticleCard(row: ArticleCardRow): ArticleCardResume {
  const title = row.titre ?? "";
  return {
    slug: slugify(title, { lower: true, strict: true }),
    title,
    canonicalUrl: row.lien ?? "",
    description: row.metadescription ?? "",
    substances: parseArticleIds(row.substances),
    specialites: parseArticleIds(row.specialites),
    pathologies: parseArticleIds(row.pathologies),
    atc: parseArticleIds(row.atc_classe),
  };
}

export async function getArticlesFromFilters(
  articlesFilters: SearchArticlesFilters,
): Promise<ArticleCardResume[]> {
  const rows = await getArticleFilterRows();

  const substances = new Set(articlesFilters.substancesList);
  const specialites = new Set(articlesFilters.specialitesList);
  const pathologies = new Set(articlesFilters.pathologiesList.map(String));
  const atc = new Set(articlesFilters.ATCList);

  // Normalize once so matching and returned cards use the same relationship IDs.
  return rows
    .map(mapArticleCard)
    .filter(
      (article) =>
        article.substances.some((id) => substances.has(id)) ||
        article.pathologies.some((id) => pathologies.has(id)) ||
        article.specialites.some((id) => specialites.has(id)) ||
        article.atc.some((code) => atc.has(code)),
    );
}

export async function getArticlesFromSearchResults(
  results: SearchResultItem[],
): Promise<ArticleCardResume[]> {
  const articlesFilters: SearchArticlesFilters = {
    ATCList: [],
    substancesList: [],
    specialitesList: [],
    pathologiesList: [], //Only patho here
  };

  for (const item of results) {
    if (!articlesFilters.specialitesList.includes(item.specId.trim()))
      articlesFilters.specialitesList.push(item.specId.trim());
    for (const subsId of item.subsIds) {
      if (!articlesFilters.substancesList.includes(subsId.trim()))
        articlesFilters.substancesList.push(subsId.trim());
    }
    //For now the articles are not displayed in the results for the research
    //So we temporarily remove this test
    // for (const code of item.pathosIds) {
    //     if (!articlesFilters.pathologiesList.includes(code))
    //         articlesFilters.pathologiesList.push(code);
    // }
    for (const code of [item.atc1Code, item.atc2Code, item.atc5Code]) {
      if (code && !articlesFilters.ATCList.includes(code.trim()))
        articlesFilters.ATCList.push(code.trim());
    }
  }

  return await getArticlesFromFilters(articlesFilters);
}

export async function getArticlesFromATC(
  codeATC: string,
): Promise<ArticleCardResume[]> {
  const articlesFilters: SearchArticlesFilters = {
    ATCList: [codeATC],
    substancesList: [],
    specialitesList: [],
    pathologiesList: [],
  };

  return getArticlesFromFilters(articlesFilters);
}

//only pathology and not classe clinique
export async function getArticlesFromPatho(
  codePatho: number,
): Promise<ArticleCardResume[]> {
  const articlesFilters: SearchArticlesFilters = {
    ATCList: [],
    substancesList: [],
    specialitesList: [],
    pathologiesList: [codePatho],
  };
  return getArticlesFromFilters(articlesFilters);
}

export async function getArticlesFromSubstances(
  subsIds: string[],
): Promise<ArticleCardResume[]> {
  const articlesFilters: SearchArticlesFilters = {
    ATCList: [],
    substancesList: subsIds,
    specialitesList: [],
    pathologiesList: [],
  };

  return getArticlesFromFilters(articlesFilters);
}

async function getArticleFilterRows() {
  "use cache: remote";
  return db
    .selectFrom("ref_articles")
    .select([
      "titre",
      "lien",
      "metadescription",
      "homepage",
      "atc_classe",
      "substances",
      "specialites",
      "pathologies",
    ])
    .execute();
}

/**
 * Pages of the site linked to the article (structured data):
 * - about: its subjects, the indications (pathologies) and the ATC classes
 * - mentions: the substances and the medicaments (can be many)
 * Only the existing pages: substances with a title, visible medicaments, known indications and ATC classes
 */
export async function getArticleLinkedEntities(
  article: Pick<Article, "substances" | "specialites" | "pathologies" | "atc">,
): Promise<{ about: ArticleLinkedEntity[], mentions: ArticleLinkedEntity[] }> {
  "use cache: remote";
  const subsIds = [...new Set(article.substances)];
  const cisList = [...new Set(article.specialites)];
  const codesPatho = [...new Set(article.pathologies)].map(Number).filter(Number.isInteger);
  const atcCodes = [...new Set(article.atc)];

  const [indications, atc1List, titles, specialites] = await Promise.all([
    codesPatho.length > 0
      ? db.selectFrom("indications").where("codePatho", "in", codesPatho).select(["id", "codePatho", "nom"]).execute()
      : [],
    atcCodes.length > 0 ? getAtc() : [],
    getSubstancesTitles(subsIds),
    cisList.length > 0
      ? db
        .selectFrom("ansm_specialite")
        .where("cis", "in", cisList)
        .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
        .select(["cis", "denomination"])
        .execute()
      : [],
  ]);

  const atcList = atc1List.flatMap((atc1) => [atc1, ...atc1.children]);
  const about: ArticleLinkedEntity[] = [
    ...codesPatho.flatMap((codePatho) => {
      const indication = indications.find((row) => Number(row.codePatho) === codePatho);
      return indication
        ? [{ type: "MedicalCondition" as const, name: indication.nom, path: `/indications/${getIndicationSlug(indication.id, indication.nom)}` }]
        : [];
    }),
    ...atcCodes.flatMap((code) => {
      const atc = atcList.find((row) => row.code === code);
      return atc ? [{ type: "DrugClass" as const, name: atc.label, path: `/atc/${getAtcSlug(atc.code, atc.label)}` }] : [];
    }),
  ];
  const mentions: ArticleLinkedEntity[] = [
    ...subsIds.flatMap((SubsId) => {
      const title = titles.get(SubsId);
      return title ? [{ type: "Drug" as const, name: title, path: `/substances/${getSubstanceSlug([{ SubsId, title }])}` }] : [];
    }),
    ...cisList.flatMap((cis) => {
      const specialite = specialites.find((row) => row.cis === cis);
      return specialite?.denomination
        ? [{ type: "Drug" as const, name: formatSpecName(specialite.denomination), path: `/medicaments/${getSpecSlug(cis, specialite.denomination)}` }]
        : [];
    }),
  ];
  return { about, mentions };
}
