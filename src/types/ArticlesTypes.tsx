import { ImageProps } from "next/image";

export type ArticleCardResume = {
  slug: string,
  title: string,
  canonicalUrl: string,
  description: string,
  substances: string[],
  specialites: string[],
  pathologies: string[],
  atc: string[],
};

export type ArticleTrackingFromType = "Page substance" | "Page pathologie" | "Page ATC1"
  | "Page ATC2" | "Page médicament" | "Recherche" | "Page d'accueil" | "Liste articles";

export type Article = {
  slug: string,
  title: string,
  source: string,
  content: string,
  category: string,
  homepage: boolean,
  canonicalUrl: string,
  description: string,
  image?: string,
};