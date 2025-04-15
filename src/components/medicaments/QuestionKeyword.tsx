import { HTMLAttributes, PropsWithChildren } from "react";

interface KeywordProps extends HTMLAttributes<HTMLDivElement> {
  excerpt: string;
}

function Keyword(
  {excerpt, children, ...props}: PropsWithChildren<KeywordProps>) {
  return (
    <span {...props}>{children}</span>
  );
};

function QuestionKeyword({
  keyword,
  questionId,
}: {
  keyword: string;
  questionId: string;
}) {

  return (
    <Keyword excerpt="ceci est mon résumé" className={`highlight-keyword-${questionId}`}>
      <span>
        {keyword}
      </span>
    </Keyword>
  );
}

export default QuestionKeyword;
