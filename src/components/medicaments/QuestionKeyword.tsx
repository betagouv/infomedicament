import { HTMLAttributes, PropsWithChildren } from "react";

interface KeywordProps extends HTMLAttributes<HTMLDivElement> {
  excerpt?: string;
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
    <Keyword className={`highlight-keyword-${questionId}`}>
      {keyword}
    </Keyword>
  );
}

export default QuestionKeyword;
