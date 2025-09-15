import { JSX } from "react";

type NoticesAnchorsSearchTerms = {
  begin: string;
  end: string;
}

export type QuestionAnchors = {
  id: string;
  highlightClass: string;
  question: JSX.Element;
  headerId?: string;
  keywords?: string[];
  unique: boolean;
};

export interface QuestionsListFormat {
  [index: string]: QuestionAnchors;
}