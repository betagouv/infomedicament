"use server";

import "server-only";
import { getGristTableData } from "@/data/grist/index";
import slugify from "slugify";
import { ImageProps } from "next/image";
import { ExtendedSearchResults, SearchArticlesFilters, } from "@/types/SearchTypes";
import { Article, ArticleCardResume } from "@/types/ArticlesTypes";
import { AdvancedATCClass, AdvancedData, DataTypeEnum } from "@/types/DataTypes";
import { ATC } from "@/types/ATCTypes";
import { ResumePatho, ResumeSubstance } from "@/db/types";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

export async function getArticles(): Promise<Article[]> {
  const records = await getGristTableData("Articles", [
    "Titre",
    "Source",
    "Contenu",
    "Theme",
    "Lien",
    "Metadescription",
    "Homepage",
    "Image",
  ]);

  return records.map(({ fields }) => {
    return {
      slug: slugify(fields.Titre as string, { lower: true, strict: true }),
      title: fields.Titre as string,
      source: fields.Source as string,
      content: fields.Contenu as string,
      category: fields.Theme as string,
      homepage: fields.Homepage as boolean,
      canonicalUrl: fields.Lien as string,
      description: fields.Metadescription as string,
      ...(fields.Image
        ? { image: fields.Image as Omit<ImageProps, "alt"> }
        : {}),
    };
  });
}

export async function getArticlesFromFilters(articlesFilters: SearchArticlesFilters): Promise<ArticleCardResume[]> {
  const records = await getGristTableData("Articles", [
    "Titre",
    "Lien",
    "Metadescription",
    "Homepage",
    "Classes_ATC",
    "Substances",
    "Specialites",
    "Pathologies"
  ]);

  const articles: any[] = [];

  records.map((record) => {
    let find = false;
    if(record.fields.Substances && articlesFilters.substancesList.length > 0){
      const substancesArticle = (record.fields.Substances as string).split(",");
      const index = substancesArticle.find((articleSubsId: string) => articlesFilters.substancesList.find((subsId: string) => subsId === articleSubsId.trim()));
      if(index) find = true;
    }
    if(!find && record.fields.Pathologies && articlesFilters.pathologiesList.length > 0){
      const pathosArticle = (record.fields.Pathologies as string).split(",");
      const index = pathosArticle.find((articleCodePatho: string) => articlesFilters.pathologiesList.find((codePatho: string) => codePatho === articleCodePatho.trim()));
      if(index) find = true;
    }
    if(!find && record.fields.Specialites && articlesFilters.specialitesList.length > 0){
      const specsArticle = (record.fields.Specialites as string).split(",");
      const index = specsArticle.find((articleCodeCIS: string) => articlesFilters.specialitesList.find((codeCIS: string) => codeCIS === articleCodeCIS.trim()));
      if(index) find = true;
    }
    if(!find && record.fields.Classes_ATC && articlesFilters.ATCList.length > 0){
      const atcArticle = (record.fields.Classes_ATC as string).split(",");
      const index = atcArticle.find((articleCodeATC: string) => articlesFilters.ATCList.find((codeATC: string) => codeATC === articleCodeATC.trim()));
      if(index) find = true;
    }
    if(find) articles.push(record);
  })

  const articlesList = articles.map(({ fields }) => {
    const substances:string[] = fields.Substances.split(',').map((subsID: string) => subsID.trim());
    const specialites:string[] = fields.Specialites.split(',').map((subsID: string) => subsID.trim());
    return {
      slug: slugify(fields.Titre as string, { lower: true, strict: true }),
      title: fields.Titre as string,
      canonicalUrl: fields.Lien as string,
      description: fields.Metadescription as string,
      substances: substances,
      specialites: specialites,
      pathologies: fields.Pathologies as number[],
      atc: fields.Classes_ATC as number[],
    };
  });
  return articlesList;
}

export async function getArticlesFromSearchResults(results: ExtendedSearchResults): Promise<ArticleCardResume[]> {
  const articlesFilters:SearchArticlesFilters = {
    ATCList: [],
    substancesList: [],
    specialitesList: [],
    pathologiesList: [],
  };

  const extendedSearchResultsKeys: DataTypeEnum[] = Object.keys(results) as DataTypeEnum[];
  extendedSearchResultsKeys.forEach((key) => {
    results[key].forEach((result: AdvancedData) => {
      if(result.type === DataTypeEnum.MEDGROUP || result.type === DataTypeEnum.EXPIRED){
        (result.result as ResumeSpecGroup).CISList.forEach((CIS: string) => {
          if(!articlesFilters.specialitesList.includes(CIS.trim())) articlesFilters.specialitesList.push(CIS.trim());
        });
      }
      else if(result.type === DataTypeEnum.PATHOLOGY)
        articlesFilters.pathologiesList.push((result.result as ResumePatho).codePatho.trim());
      else if(result.type === DataTypeEnum.SUBSTANCE) 
        articlesFilters.substancesList.push((result.result as ResumeSubstance).SubsId.trim());
      else if(result.type === DataTypeEnum.ATCCLASS) {
        articlesFilters.ATCList.push((result.result as AdvancedATCClass).class.code.trim());
        (result.result as AdvancedATCClass).subclasses.map((subclass: ATC) => {
          articlesFilters.ATCList.push((subclass).code.trim());
        });
      }
    })
  });
  return await getArticlesFromFilters(articlesFilters);
}

export async function getArticlesFromATC(codeATC: string): Promise<ArticleCardResume[]> {
  const articlesFilters:SearchArticlesFilters = {
    ATCList: [codeATC],
    substancesList: [],
    specialitesList: [],
    pathologiesList: [],
  };

  return getArticlesFromFilters(articlesFilters);
}

export async function getArticlesFromPatho(codePatho: string): Promise<ArticleCardResume[]> {
  const articlesFilters:SearchArticlesFilters = {
    ATCList: [],
    substancesList: [],
    specialitesList: [],
    pathologiesList: [codePatho],
  };
  return getArticlesFromFilters(articlesFilters);
}

export async function getArticlesFromSubstances(ids: string[]): Promise<ArticleCardResume[]> {
  const articlesFilters:SearchArticlesFilters = {
    ATCList: [],
    substancesList: ids,
    specialitesList: [],
    pathologiesList: [],
  };

  return getArticlesFromFilters(articlesFilters);
}

