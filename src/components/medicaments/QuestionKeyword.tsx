import { fr } from "@codegouvfr/react-dsfr";

function QuestionKeyword({
  keyword,
  questionId,
  excerpt,
}: {
  keyword: string;
  questionId: string;
  excerpt: string;
}) {
  return (
    <span className={`highlight-keyword-${questionId} test-scroll`}>
      {/* <span className={["hidden-excerpt", fr.cx("fr-hidden")].join(" ",)} aria-hidden="true">{excerpt}</span> */}
      {keyword}
    </span>
  );
}

export default QuestionKeyword;
