export type AdvancedRating = {
  question1: string,
  question2: string,
};

export type SimpleRating = {
  rating: number,
  pageId: string,
}

export const QUESTION_1_OPTIONS: string[] = [
  "Oui, immédiatement et clairement",
  "Oui, mais après quelques recherches",
  "Non, pas vraiment",
  "Non, pas du tout",
];

export const QUESTION_2_OPTIONS: string[] = [
  "J'ai trouvé l'information que je cherchais et je me sens rassuré·e",
  "J'ai trouvé une partie de l'information, mais j'ai encore des doutes",
  "Je n'ai pas trouvé l'information que je cherchais",
  "Je n'ai pas encore pu me faire un avis",
];