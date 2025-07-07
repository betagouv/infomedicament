import { JSX } from "react";

type NoticesAnchorsSearchTerms = {
  begin: string;
  end: string;
}

export type HeaderDetails = {
  id: string;
  headerTerms: NoticesAnchorsSearchTerms;
}

export type QuestionAnchors = {
  id: string;
  highlightClass: string;
  question: JSX.Element;
  anchors?: HeaderDetails[];
  keywords?: string[];
  unique: boolean;
};

export interface QuestionsListFormat {
  [index: string]: QuestionAnchors;
}