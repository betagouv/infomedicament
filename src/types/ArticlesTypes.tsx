export type ArticleCardResume = {
  slug: string,
  title: string,
  canonicalUrl: string,
  description: string,
  substances: string[],
  specialites: string[],
  pathologies: number[],
  atc: number[],
}


export type ArticleTrackingFromType = "Page substance" | "Page pathologie" | "Page ATC1" 
  | "Page ATC2" | "Page médicament" | "Recherche";