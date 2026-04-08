"use client";

import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from "styled-components";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import ContentContainer from "@/components/generic/ContentContainer";
import InteractionSubstanceInput from "@/components/InteractionSubstanceInput";
import { InteractionsSearchEntry } from "@/db/types";
import { InteractionResult } from "@/db/utils/interactions";

// Maps raw DB codes to French labels
const CODE_LABELS: Record<string, string> = {
  ci: "Contre-indication",
  asdec: "Association déconseillée",
  dcn: "Association déconseillée",
  dnc: "Association déconseillée",
  pe: "Précaution d'emploi",
  apec: "A prendre en compte",
  neg: "Négligeable",
  texte: "Voir texte",
};

const CODE_COLORS: Record<string, string> = {
  ci: "#8B1A2B",
  asdec: "#E8836A",
  dcn: "#E8836A",
  dnc: "#E8836A",
  pe: "#C8A020",
  apec: "#F0D040",
  neg: "#9e9e9e",
  texte: "#9e9e9e",
};

// Light backgrounds need dark text
const LIGHT_CODES = new Set(["pe", "apec", "neg", "texte"]);

type NiveauBadgeData = { label: string; color: string; textColor: string };

function getNiveauBadges(niveau: string): NiveauBadgeData[] {
  const seen = new Set<string>();
  return niveau
    .split("/")
    .map((code) => ({
      label: CODE_LABELS[code] ?? code,
      color: CODE_COLORS[code] ?? "#9e9e9e",
      textColor: LIGHT_CODES.has(code) ? "#1e1e1e" : "#fff",
    }))
    .filter(({ label }) => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
}


const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${fr.spacing("2w")};
  @media (max-width: 48em) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PlusSign = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  flex-shrink: 0;
  color: var(--text-action-high-blue-france);
  @media (max-width: 48em) {
    text-align: center;
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${fr.spacing("2w")};
  margin-top: ${fr.spacing("2w")};
  @media (max-width: 48em) {
    justify-content: flex-end;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${fr.spacing("2w")};
  flex-wrap: wrap;
  margin-bottom: ${fr.spacing("2w")};
`;

const NiveauBadge = styled.span<{ $color: string; $textColor: string }>`
  display: inline-block;
  padding: ${fr.spacing("1v")} ${fr.spacing("2w")};
  border-radius: 2rem;
  background-color: ${(p) => p.$color};
  color: ${(p) => p.$textColor};
  font-weight: bold;
  font-size: 0.875rem;
`;

const ResultBlock = styled.div`
  margin-top: ${fr.spacing("3w")};
  padding: ${fr.spacing("2w")};
  border: 1px solid var(--border-default-grey);
  border-radius: 8px;
`;

const SectionTitle = styled.p`
  font-weight: bold;
  margin-bottom: ${fr.spacing("1w")};
`;

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={elements.length}>
          {listItems.map((item, i) => (
            <li key={i}>{item.replace(/^-\s*/, "")}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  for (const line of lines) {
    if (line.startsWith("- ")) {
      listItems.push(line);
    } else {
      flushList();
      elements.push(<p key={elements.length}>{line}</p>);
    }
  }
  flushList();

  return <>{elements}</>;
}

const ClassExplanation = styled.p`
  font-size: 0.875rem;
  font-style: italic;
  color: var(--text-mention-grey);
  margin-top: ${fr.spacing("1w")};
`;

const LegendDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${(p) => p.$color};
  margin-right: ${fr.spacing("1w")};
  margin-top: 3px;
  flex-shrink: 0;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${fr.spacing("1w")};
`;

const NIVEAUX = [
  {
    label: "Contre-indication",
    color: CODE_COLORS.ci,
    description:
      "La contre-indication rend ce cumul impossible. Elle peut être très dangereuse.",
  },
  {
    label: "Association déconseillée",
    color: CODE_COLORS.asdec,
    description:
      "L'association déconseillée doit être le plus souvent évitée, sauf après examen attentif du rapport bénéfice/risque.",
  },
  {
    label: "Précaution d'emploi",
    color: CODE_COLORS.pe,
    description:
      "C'est le plus fréquent. L'association est possible dès lors que sont respectées les recommandations, notamment au début du traitement.",
  },
  {
    label: "A prendre en compte",
    color: CODE_COLORS.apec,
    description:
      "A prendre en compte correspond à un risque d'interaction plus faible ou moins bien documenté.",
  },
];

export default function InteractionsPage() {
  const [slot1, setSlot1] = useState<InteractionsSearchEntry | null>(null);
  const [slot2, setSlot2] = useState<InteractionsSearchEntry | null>(null);
  const [results, setResults] = useState<InteractionResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerifier() {
    if (!slot1 || !slot2) return;
    setLoading(true);
    try {
      const res = await fetch("/interactions/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subst_ids_1: slot1.subst_ids,
          class_ids_1: slot1.class_ids,
          subst_ids_2: slot2.subst_ids,
          class_ids_2: slot2.class_ids,
        }),
      });
      const data: InteractionResult[] = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setSlot1(null);
    setSlot2(null);
    setResults(null);
  }

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-8", "fr-mt-4w")}>
          <h1 className={fr.cx("fr-h2")}>Interactions médicamenteuses</h1>
          <p>
            Vérifier en 1 clic si vous pouvez prendre un médicament avec un
            autre.{" "}
            <a
              href="https://ansm.sante.fr/documents/reference/thesaurus-des-interactions-medicamenteuses"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source ANSM
            </a>
          </p>

          <InputRow>
            <InteractionSubstanceInput
              id="interaction-slot-1"
              value={slot1}
              onSelect={(e) => {
                setSlot1(e);
                setResults(null);
              }}
              onClear={() => {
                setSlot1(null);
                setResults(null);
              }}
            />
            <PlusSign aria-hidden>+</PlusSign>
            <InteractionSubstanceInput
              id="interaction-slot-2"
              value={slot2}
              onSelect={(e) => {
                setSlot2(e);
                setResults(null);
              }}
              onClear={() => {
                setSlot2(null);
                setResults(null);
              }}
            />
          </InputRow>

          <ActionRow>
            <Button
              type="button"
              disabled={!slot1 || !slot2 || loading}
              onClick={handleVerifier}
            >
              {loading ? "Vérification…" : "Vérifier"}
            </Button>
            {(slot1 || slot2) && (
              <button
                type="button"
                className={fr.cx("fr-link")}
                onClick={handleClear}
              >
                Tout effacer
              </button>
            )}
          </ActionRow>

          {results !== null && (
            <ResultBlock>
              {results.length === 0 ? (
                <Alert
                  severity="success"
                  title="Aucune interaction connue entre ces deux substances."
                  description=""
                  small
                />
              ) : (
                results.map((r, i) => {
                  const badges = r.niveau ? getNiveauBadges(r.niveau) : [];
                  const sections = [
                    { label: "Risque", text: r.risque },
                    { label: "Conduite à tenir", text: r.conduite },
                    { label: "Commentaire", text: r.commentaire },
                  ];
                  return (
                    <div
                      key={`${r.subst1_name}|${r.subst2_name}|${r.niveau}`}
                      className={fr.cx(i > 0 ? "fr-mt-3w" : undefined)}
                    >
                      <ResultHeader>
                        <span>
                          <strong>{slot1!.label}</strong>
                          {" ⇄ "}
                          <strong>{slot2!.label}</strong>
                        </span>
                        {badges.map((b) => (
                          <NiveauBadge key={b.label} $color={b.color} $textColor={b.textColor}>
                            {b.label}
                          </NiveauBadge>
                        ))}
                      </ResultHeader>
                      {sections.map(
                        ({ label, text }) =>
                          text && (
                            <React.Fragment key={label}>
                              <SectionTitle>{label}</SectionTitle>
                              <FormattedText text={text} />
                            </React.Fragment>
                          ),
                      )}
                      {(r.subst1_class_name || r.subst2_class_name) && (
                        <ClassExplanation>
                          {r.subst1_class_name && slot1!.class_ids.length === 0 && (
                            <><em>{slot1!.label}</em>{` dans ${r.subst1_class_name}`}<br /></>
                          )}
                          {r.subst2_class_name && slot2!.class_ids.length === 0 && (
                            <><em>{slot2!.label}</em>{` dans ${r.subst2_class_name}`}</>
                          )}
                        </ClassExplanation>
                      )}
                    </div>
                  );
                })
              )}
            </ResultBlock>
          )}

          <div className={fr.cx("fr-mt-4w")}>
            <Accordion label="4 niveaux de risque" titleAs="h2">
              {NIVEAUX.map(({ label, color, description }) => (
                <LegendItem key={label}>
                  <LegendDot $color={color} />
                  <span>
                    <strong>{label}</strong> — {description}
                  </span>
                </LegendItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
