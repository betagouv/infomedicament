"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import QuestionSearchForm from "@/components/search/QuestionSearchForm";
import { formatSpecName } from "@/displayUtils";
import type {
  SmartSearchCandidate,
  SmartSearchResponse,
} from "@/types/SmartSearchTypes";
import styles from "./QuestionPage.module.css";

function candidateLabel(candidate: SmartSearchCandidate) {
  return formatSpecName(candidate.specName);
}

function CandidateSelector({
  candidates,
  query,
  selected,
}: {
  candidates: SmartSearchCandidate[];
  query: string;
  selected?: SmartSearchCandidate;
}) {
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setPendingCandidateId(null);
  }, [query, selected?.specId]);

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      {candidates.map((candidate) => {
        const isSelected = candidate.specId === selected?.specId;
        const isPending =
          candidate.specId === pendingCandidateId && !isSelected;

        return (
          <div
            className={fr.cx("fr-col-12", "fr-col-md-6", "fr-mb-2w")}
            key={candidate.specId}
          >
            <Link
              href={`/question?q=${encodeURIComponent(query)}&selectedSpecId=${encodeURIComponent(candidate.specId)}`}
              className={`${styles.candidateLink} ${isSelected || isPending ? styles.candidateActive : ""}`}
              aria-current={isSelected ? "true" : undefined}
              aria-busy={isPending || undefined}
              onClick={() => {
                if (!isSelected) setPendingCandidateId(candidate.specId);
              }}
            >
              <strong>{candidateLabel(candidate)}</strong>
              {isPending && (
                <span className={styles.loader} role="status">
                  <span className={fr.cx("fr-sr-only")}>
                    Recherche dans la notice en cours
                  </span>
                </span>
              )}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function QuestionPage({
  query,
  smartSearch,
}: {
  query?: string;
  smartSearch?: SmartSearchResponse;
}) {
  const selected = smartSearch?.selectedCandidate;
  const hit = smartSearch?.hits[0];
  const understoodQuestion = smartSearch?.extraction.question || query;
  const isSafetyState =
    smartSearch?.status === "blocked" ||
    smartSearch?.status === "urgent_medical_attention";

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9")}>
          <header className={fr.cx("fr-pt-5w", "fr-pb-3w")}>
            <p
              className={`${styles.eyebrow} ${fr.cx("fr-text--sm", "fr-mb-1w")}`}
            >
              Information issue des notices officielles
            </p>
            <h1 className={fr.cx("fr-h2", "fr-mb-2w")}>
              Poser une question sur un médicament
            </h1>
            <p className={fr.cx("fr-text--lg", "fr-mb-3w")}>
              Décrivez simplement ce que vous souhaitez savoir. Nous identifions
              le médicament, puis recherchons le passage pertinent dans sa
              notice.
            </p>
            <QuestionSearchForm initialValue={query} label="Votre question" />
          </header>

          {smartSearch && understoodQuestion && (
            <Highlight size="lg" className={fr.cx("fr-mb-3w")}>
              <strong>Question comprise</strong>
              <br />
              {understoodQuestion}
            </Highlight>
          )}

          {smartSearch && (
            <div className={fr.cx("fr-pb-6w")} aria-live="polite">
              {isSafetyState && smartSearch.topBlock && (
                <Alert
                  severity="error"
                  title={smartSearch.topBlock.title}
                  description={smartSearch.topBlock.message}
                  as="h2"
                  className={fr.cx("fr-mb-3w")}
                />
              )}

              {!isSafetyState &&
                smartSearch.status === "unavailable" &&
                smartSearch.topBlock && (
                  <Alert
                    severity="error"
                    title={smartSearch.topBlock.title}
                    description={smartSearch.topBlock.message}
                    as="h2"
                    className={fr.cx("fr-mb-3w")}
                  />
                )}

              {!isSafetyState &&
                smartSearch.status === "needs_confirmation" && (
                  <section
                    className={`${styles.card} ${fr.cx("fr-p-3w", "fr-mb-3w")}`}
                  >
                    <p
                      className={`${styles.medicineLabel} ${fr.cx("fr-mb-1w")}`}
                    >
                      Étape 1 · Choix de la notice
                    </p>
                    <h2 className={fr.cx("fr-h4", "fr-mb-1w")}>
                      De quel médicament parlez-vous&nbsp;?
                    </h2>
                    <p className={fr.cx("fr-mb-3w")}>
                      Plusieurs notices correspondent à votre question.
                      Choisissez celle de votre médicament pour obtenir le bon
                      passage.
                    </p>
                    <CandidateSelector
                      candidates={smartSearch.candidates}
                      query={query ?? ""}
                    />
                  </section>
                )}

              {!isSafetyState && selected && (
                <section
                  className={`${styles.card} ${styles.medicineCard} ${fr.cx("fr-p-3w", "fr-mb-3w")}`}
                >
                  <div>
                    <p
                      className={`${styles.medicineLabel} ${fr.cx("fr-mb-1w")}`}
                    >
                      Notice consultée
                    </p>
                    <h2 className={fr.cx("fr-h5", "fr-mb-1w")}>
                      {candidateLabel(selected)}
                    </h2>
                    <Link href={`/medicaments/${selected.specId}`}>
                      Voir la fiche du médicament
                    </Link>
                  </div>
                  <Badge severity="success">Notice retenue</Badge>
                </section>
              )}

              {!isSafetyState && hit?.answer && selected && (
                <section
                  className={`${styles.card} ${styles.answerCard} ${fr.cx("fr-p-3w", "fr-mb-3w")}`}
                >
                  <p className={`${styles.medicineLabel} ${fr.cx("fr-mb-1w")}`}>
                    Réponse trouvée dans la notice
                  </p>
                  <h2 className={fr.cx("fr-h3", "fr-mb-3w")}>
                    {hit.sub_header || "Extrait pertinent"}
                  </h2>
                  <div className={styles.answerText}>
                    <p>{hit.answer}</p>
                  </div>
                  <footer className={styles.source}>
                    <p className={fr.cx("fr-text--sm", "fr-mb-1w")}>
                      Ce passage est reproduit depuis la notice officielle, sans
                      conseil médical ajouté.
                    </p>
                    <Link href={`/medicaments/${selected.specId}`}>
                      Consulter la notice complète
                    </Link>
                  </footer>
                </section>
              )}

              {!isSafetyState &&
                selected &&
                smartSearch.candidates.length > 1 && (
                  <details className={styles.changeNotice}>
                    <summary>
                      Ce n’est pas le bon médicament&nbsp;? Changer de notice
                    </summary>
                    <div className={fr.cx("fr-mt-2w")}>
                      <CandidateSelector
                        candidates={smartSearch.candidates}
                        query={query ?? ""}
                        selected={selected}
                      />
                    </div>
                  </details>
                )}

              {!isSafetyState &&
                (smartSearch.status === "no_answer" ||
                  smartSearch.status === "no_notice") &&
                smartSearch.topBlock && (
                  <Alert
                    severity="warning"
                    title={smartSearch.topBlock.title}
                    description={smartSearch.topBlock.message}
                    as="h2"
                    className={fr.cx("fr-mb-3w")}
                  />
                )}

              {!isSafetyState && smartSearch.status === "no_results" && (
                <Alert
                  severity="warning"
                  title="Médicament non identifié"
                  description="Indiquez le nom du médicament ou de sa substance active dans votre question."
                  as="h2"
                  className={fr.cx("fr-mb-3w")}
                />
              )}

              {!isSafetyState && smartSearch.status === "results" && (
                <Alert
                  severity="info"
                  title="Précisez votre question"
                  description="Ajoutez ce que vous souhaitez savoir sur le médicament, par exemple sa prise, ses précautions ou ses effets indésirables."
                  as="h2"
                  className={fr.cx("fr-mb-3w")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </ContentContainer>
  );
}
