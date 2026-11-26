export type ArticleCardResume = {
  slug: string;
  title: string;
  canonicalUrl: string;
  description: string;
  substances: string[];
  specialites: string[];
  pathologies: string[];
  atc: string[];
};

export type ArticleTrackingFromType =
  | "Page substance"
  | "Page indication"
  | "Page ATC1"
  | "Page ATC2"
  | "Page médicament"
  | "Recherche"
  | "Page d'accueil"
  | "Liste articles";

export type Article = {
  slug: string;
  title: string;
  source: string;
  content: string;
  category: string;
  homepage: boolean;
  canonicalUrl: string;
  description: string;
  image?: string;
  // Linked pages: SubsIds, CIS, codePatho of the indications, ATC codes
  substances: string[];
  specialites: string[];
  pathologies: string[];
  atc: string[];
};

// Page of the site linked to an article (structured data "about" / "mentions")
export type ArticleLinkedEntity = {
  type: "Drug" | "MedicalCondition" | "DrugClass";
  name: string;
  // Path of the page on the site, e.g. "/substances/paracetamol-02202"
  path: string;
};
