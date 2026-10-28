"use server";

import "server-only";
import db from "@/db/"
import slugify from "slugify";
import { SearchArticlesFilters, SearchResultItem } from "@/types/SearchTypes";
import { Article, ArticleCardResume } from "@/types/ArticlesTypes";
import type { RefArticles } from "@/db/types";

export async function getArticles(): Promise<Article[]> {
  "use cache: remote";

    const rows = await db.selectFrom("ref_articles")
        .select(["titre", "source", "contenu", "theme", "lien", "metadescription", "homepage", "image"])
        .execute();

    return rows.map(row => {
        return {
            slug: slugify(row.titre as string, { lower: true, strict: true }),
            title: row.titre as string,
            source: row.source as string,
            content: row.contenu as string,
            category: row.theme as string,
            homepage: row.homepage as boolean,
            canonicalUrl: row.lien as string,
            description: row.metadescription as string,
            ...(row.image
                ? { image: row.image as string }
                : {}),
        };
    });
}

function parseArticleIds(value: string | null): string[] {
    return (value ?? "").split(",").map((id) => id.trim()).filter(Boolean);
}

type ArticleCardRow = Pick<RefArticles,
    "titre" | "lien" | "metadescription" | "substances" | "specialites" | "pathologies" | "atc_classe"
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

export async function getArticlesFromFilters(articlesFilters: SearchArticlesFilters): Promise<ArticleCardResume[]> {
    const rows = await getArticleFilterRows();

    const substances = new Set(articlesFilters.substancesList);
    const specialites = new Set(articlesFilters.specialitesList);
    const pathologies = new Set(articlesFilters.pathologiesList.map(String));
    const atc = new Set(articlesFilters.ATCList);

    // Normalize once so matching and returned cards use the same relationship IDs.
    return rows.map(mapArticleCard).filter((article) =>
        article.substances.some((id) => substances.has(id)) ||
        article.pathologies.some((id) => pathologies.has(id)) ||
        article.specialites.some((id) => specialites.has(id)) ||
        article.atc.some((code) => atc.has(code)),
    );
}

export async function getArticlesFromSearchResults(results: SearchResultItem[]): Promise<ArticleCardResume[]> {
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

export async function getArticlesFromATC(codeATC: string): Promise<ArticleCardResume[]> {
    const articlesFilters: SearchArticlesFilters = {
        ATCList: [codeATC],
        substancesList: [],
        specialitesList: [],
        pathologiesList: [],
    };

    return getArticlesFromFilters(articlesFilters);
}

//only pathology and not classe clinique
export async function getArticlesFromPatho(codePatho: number): Promise<ArticleCardResume[]> {
    const articlesFilters: SearchArticlesFilters = {
        ATCList: [],
        substancesList: [],
        specialitesList: [],
        pathologiesList: [codePatho],
    };
    return getArticlesFromFilters(articlesFilters);
}

export async function getArticlesFromSubstances(ids: string[]): Promise<ArticleCardResume[]> {
    const articlesFilters: SearchArticlesFilters = {
        ATCList: [],
        substancesList: ids,
        specialitesList: [],
        pathologiesList: [],
    };

    return getArticlesFromFilters(articlesFilters);
}

async function getArticleFilterRows() {
  "use cache: remote";
  return db.selectFrom("ref_articles")
        .select(["titre", "lien", "metadescription", "homepage", "atc_classe", "substances", "specialites", "pathologies"])
        .execute();
}
