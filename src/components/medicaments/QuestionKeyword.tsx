import { fr } from "@codegouvfr/react-dsfr";

function QuestionKeyword({
  keyword,
  questionId,
}: {
  keyword: string;
  questionId: string;
}) {
  return (
    <span className={`highlight-keyword-${questionId} scroll-m-150`}>
      {keyword}
    </span>
  );
}

export default QuestionKeyword;
