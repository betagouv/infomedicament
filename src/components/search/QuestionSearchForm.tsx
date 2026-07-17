"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { trackSearchEvent } from "@/services/tracking";

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
      <Input
        label={label}
        textArea
        nativeTextAreaProps={{
          id: "question-search-input",
          name: "q",
          defaultValue: initialValue,
          placeholder: "Ex. Puis-je prendre ce médicament pendant la grossesse ?",
          rows: 1,
          required: true,
          style: {
            height: "2.5rem",
            minHeight: "2.5rem",
            resize: "vertical",
          },
        }}
        addon={(
          <Button
            iconId="fr-icon-search-line"
            title="Rechercher dans les notices"
            type="submit"
          />
        )}
      />

      {showExamples && (
        <div>
          <p className={fr.cx("fr-text--sm", "fr-mb-0", "fr-mt-2w")}>Quelques exemples :</p>
          <ul className={fr.cx("fr-tags-group", "fr-mt-1w")}>
            {EXAMPLES.map((example) => (
              <li key={example}>
                <Tag
                  small
                  linkProps={{ href: `/question?q=${encodeURIComponent(example)}` }}
                >
                  {example}
                </Tag>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
