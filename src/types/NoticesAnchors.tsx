import { JSX } from "react";

export type QuestionAnchors = {
  id: string;
  highlightClass: string;
  question: JSX.Element;
  headerId?: string;
  keywords?: string[];
  unique: boolean;
  tracking: string;
  icon: string;
};

export interface QuestionsListFormat {
  [index: string]: QuestionAnchors;
}