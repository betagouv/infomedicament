export type QuestionAnchors = {
  id: string;
  highlightClass: string;
  question: string;
  headerId?: string;
  keywords?: string[];
  queryText?: string;
  unique: boolean;
  tracking: string;
  icon: string;
};

export interface QuestionsListFormat {
  [index: string]: QuestionAnchors;
}
