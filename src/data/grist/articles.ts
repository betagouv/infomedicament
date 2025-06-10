import "server-only";
import { getGristTableData } from "@/data/grist/index";
import slugify from "slugify";
import { ImageProps } from "next/image";
import { SearchArticlesFilters, } from "@/types/SearchTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";

export async function getArticles() {
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
      const index = (record.fields.Pathologies as number[]).find((articleCodePatho: number) => articlesFilters.pathologiesList.find((codePatho: string) => parseInt(codePatho) === articleCodePatho));
      if(index) find = true;
    }
    if(!find && record.fields.Specialites && articlesFilters.specialitesList.length > 0){
      const specsArticle = (record.fields.Specialites as string).split(",");
      const index = specsArticle.find((articleCodeCIS: string) => articlesFilters.specialitesList.find((codeCIS: string) => codeCIS === articleCodeCIS.trim()));
      if(index) find = true;
    }
    if(!find && record.fields.Classes_ATC && articlesFilters.ATCList.length > 0){
      const index = (record.fields.Classes_ATC as number[]).find((articleCodeATC: number) => articlesFilters.ATCList.find((codeATC: string) => parseInt(codeATC) === articleCodeATC));
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
