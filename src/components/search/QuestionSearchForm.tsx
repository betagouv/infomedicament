"use client";

import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { trackSearchEvent } from "@/services/tracking";
import styles from "./QuestionSearchForm.module.css";

const EXAMPLES = [
  "Puis-je boire de l’alcool avec du Xanax ?",
  "Comment prendre du Doliprane 500 mg ?",
  "Quels sont les effets indésirables de l’amoxicilline ?",
];

export default function QuestionSearchForm({
  initialValue,
  showExamples = false,
  label = "Votre question",
}: {
  initialValue?: string;
  showExamples?: boolean;
  label?: string;
}) {
  return (
    <form
      action="/question"
      method="get"
      onSubmit={(event) => {
        const question = new FormData(event.currentTarget).get("q");
        if (typeof question === "string") trackSearchEvent(question);
      }}
    >
      <label className={fr.cx("fr-label", "fr-mb-1w")} htmlFor="question-search-input">
        {label}
      </label>
      <div className={styles.field}>
        <textarea
          className={styles.input}
          id="question-search-input"
          name="q"
          defaultValue={initialValue}
          placeholder="Ex. Puis-je prendre ce médicament pendant la grossesse ?"
          rows={1}
          required
        />
        <button
          className={`${fr.cx("fr-btn", "fr-icon-search-line")} ${styles.submit}`}
          type="submit"
          title="Rechercher dans les notices"
        >
          <span className={fr.cx("fr-sr-only")}>Rechercher dans les notices</span>
        </button>
      </div>

      {showExamples && (
        <div>
          <p className={fr.cx("fr-text--sm", "fr-mb-0", "fr-mt-2w")}>Quelques exemples :</p>
          <ul className={styles.examples}>
            {EXAMPLES.map((example) => (
              <li key={example}>
                <Link className={styles.exampleLink} href={`/question?q=${encodeURIComponent(example)}`}>{example}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
