import { ArticleCardResume } from "./ArticlesTypes";

export type SearchArticlesFilters = {
  ATCList: string[];
  substancesList: string[];
  specialitesList: string[];
  pathologiesList: string[];
}

export type SearchArticles = {
  articlesList: ArticleCardResume[];
  articlesFilters?: SearchArticlesFilters,
}