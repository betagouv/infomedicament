"use server";

import "server-only";
import db from "@/db/"
import slugify from "slugify";
import { SearchArticlesFilters } from "@/types/SearchTypes";
import { Article, ArticleCardResume } from "@/types/ArticlesTypes";
import { SearchResultItem } from "@/db/utils/search";

export async function getArticles(): Promise<Article[]> {

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

export async function getArticlesFromFilters(articlesFilters: SearchArticlesFilters): Promise<ArticleCardResume[]> {
    const rows = await db.selectFrom("ref_articles")
        .select(["titre", "lien", "metadescription", "homepage", "atc_classe", "substances", "specialites", "pathologies"])
        .execute();

    const articles: any[] = [];

    rows.map((row) => {
        let find = false;
        // We check if any article matches the substance filter
        if (row.substances && articlesFilters.substancesList.length > 0) {
            const substancesArticle = (row.substances as string).split(",");
            const index = substancesArticle.find((articleSubsId: string) => articlesFilters.substancesList.find((subsId: string) => subsId === articleSubsId.trim()));
            if (index) find = true;
        }
        // else, we check if there's a pathologies filter match
        if (!find && row.pathologies && articlesFilters.pathologiesList.length > 0) {
            const pathosArticle = (row.pathologies as string).split(",");
            const index = pathosArticle.find((articleCodePatho: string) => articlesFilters.pathologiesList.find((codePatho: string) => codePatho === articleCodePatho.trim()));
            if (index) find = true;
        }
        // else, we check for specialites match
        if (!find && row.specialites && articlesFilters.specialitesList.length > 0) {
            const specsArticle = (row.specialites as string).split(",");
            const index = specsArticle.find((articleCodeCIS: string) => articlesFilters.specialitesList.find((codeCIS: string) => codeCIS === articleCodeCIS.trim()));
            if (index) find = true;
        }
        // finally, we look for an ATC match
        if (!find && row.atc_classe && articlesFilters.ATCList.length > 0) {
            const atcArticle = (row.atc_classe as string).split(",");
            const index = atcArticle.find((articleCodeATC: string) => articlesFilters.ATCList.find((codeATC: string) => codeATC === articleCodeATC.trim()));
            if (index) find = true;
        }
        if (find) articles.push(row);
    })

    const articlesList = articles.map(article => {
        const substances: string[] = article.substances.split(',').map((subsID: string) => subsID.trim());
        const specialites: string[] = article.specialites.split(',').map((subsID: string) => subsID.trim());
        return {
            slug: slugify(article.titre as string, { lower: true, strict: true }),
            title: article.titre as string,
            canonicalUrl: article.lien as string,
            description: article.metadescription as string,
            substances: substances,
            specialites: specialites,
            pathologies: article.pathologies as string[],
            atc: article.atc_classe as string[],
        };
    });
    return articlesList;
}

export async function getArticlesFromSearchResults(results: SearchResultItem[]): Promise<ArticleCardResume[]> {
    const articlesFilters: SearchArticlesFilters = {
        ATCList: [],
        substancesList: [],
        specialitesList: [],
        pathologiesList: [],
    };

    for (const item of results) {
        for (const cis of item.CISList) {
            if (!articlesFilters.specialitesList.includes(cis.trim()))
                articlesFilters.specialitesList.push(cis.trim());
        }
        for (const subsId of item.subsIds) {
            if (!articlesFilters.substancesList.includes(subsId.trim()))
                articlesFilters.substancesList.push(subsId.trim());
        }
        for (const code of item.pathosCodes) {
            if (!articlesFilters.pathologiesList.includes(code.trim()))
                articlesFilters.pathologiesList.push(code.trim());
        }
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

export async function getArticlesFromPatho(codePatho: string): Promise<ArticleCardResume[]> {
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