"use client";

import React, { useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { interactionSelectionKey } from "@/utils/interactionSelection";
import { fr } from "@codegouvfr/react-dsfr";
import styled from "styled-components";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import InteractionSubstanceInput from "@/components/InteractionSubstanceInput";
import { InteractionsSearchEntry } from "@/db/types";
import { InteractionResult } from "@/db/utils/interactions";
import { CODE_COLORS, getNiveauBadges } from "./niveauBadges";

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
        </ul>,
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

const ChapeauLabel = styled.p`
  font-style: italic;
  margin-top: ${fr.spacing("2w")};
  margin-bottom: ${fr.spacing("1w")};
`;

const ChapeauText = styled.div`
  p,
  li {
    font-size: 0.875rem;
    color: var(--text-mention-grey);
    font-style: italic;
  }
`;

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

type NiveauLegend = { label: string; color: string; description: string };

const NIVEAUX: NiveauLegend[] = [
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

type Props = {
  slot1: InteractionsSearchEntry | null;
  slot2: InteractionsSearchEntry | null;
  results: InteractionResult[] | null;
};

export default function InteractionsBlock(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, startTransition] = useTransition();
  const [{ slot1, slot2, results }, setSelection] = useOptimistic(props);

  function navigate(next: Props, verified = false) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [name, entry] of [
      ["medicament1", next.slot1],
      ["medicament2", next.slot2],
    ] as const) {
      if (entry) params.set(name, interactionSelectionKey(entry));
      else params.delete(name);
    }
    if (verified) params.set("verifier", "1");
    else params.delete("verifier");
    const query = params.toString();
    startTransition(() => {
      setSelection(next);
      router.push(
        `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
        { scroll: false },
      );
    });
  }

  function handleVerifier() {
    if (slot1 && slot2) navigate({ slot1, slot2, results }, true);
  }

  function handleClear() {
    navigate({ slot1: null, slot2: null, results: null });
  }

  return (
    <>
      <InputRow>
        <InteractionSubstanceInput
          id="interaction-slot-1"
          value={slot1}
          onSelect={(e) => {
            navigate({ slot1: e, slot2, results: null });
          }}
          onClear={() => {
            navigate({ slot1: null, slot2, results: null });
          }}
        />
        <PlusSign aria-hidden>+</PlusSign>
        <InteractionSubstanceInput
          id="interaction-slot-2"
          value={slot2}
          onSelect={(e) => {
            navigate({ slot1, slot2: e, results: null });
          }}
          onClear={() => {
            navigate({ slot1, slot2: null, results: null });
          }}
        />
      </InputRow>

      <ActionRow>
        <Button
          type="button"
          disabled={!slot1 || !slot2 || loading}
          onClick={handleVerifier}
        >
          {loading ? "Chargement…" : "Vérifier"}
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

      <p role="status" className={fr.cx("fr-sr-only")}>
        {loading
          ? "Chargement…"
          : results !== null
            ? results.length === 0
              ? "Vérification terminée : aucune interaction connue."
              : `Vérification terminée : ${results.length} interaction(s) trouvée(s).`
            : ""}
      </p>

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
                  key={`${r.subst1Name}|${r.subst2Name}|${r.niveau}`}
                  className={fr.cx(i > 0 ? "fr-mt-3w" : undefined)}
                >
                  <ResultHeader>
                    <span>
                      <strong>{slot1!.label}</strong>
                      {" ⇄ "}
                      <strong>{slot2!.label}</strong>
                    </span>
                    {badges.map((b) => (
                      <NiveauBadge
                        key={b.label}
                        $color={b.color}
                        $textColor={b.textColor}
                      >
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
                  {(r.subst1ClassName || r.subst2ClassName) && (
                    <ClassExplanation>
                      {r.subst1ClassName && slot1!.class_ids.length === 0 && (
                        <>
                          <strong>{slot1!.label}</strong>
                          {` dans ${r.subst1ClassName}`}
                          <br />
                        </>
                      )}
                      {r.subst2ClassName && slot2!.class_ids.length === 0 && (
                        <>
                          <strong>{slot2!.label}</strong>
                          {` dans ${r.subst2ClassName}`}
                        </>
                      )}
                    </ClassExplanation>
                  )}
                  {r.subst1Chapeau && (
                    <>
                      <ChapeauLabel>{r.subst1ClassName}</ChapeauLabel>
                      <ChapeauText>
                        <FormattedText text={r.subst1Chapeau} />
                      </ChapeauText>
                    </>
                  )}
                  {r.subst2Chapeau && (
                    <>
                      <ChapeauLabel>{r.subst2ClassName}</ChapeauLabel>
                      <ChapeauText>
                        <FormattedText text={r.subst2Chapeau} />
                      </ChapeauText>
                    </>
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
    </>
  );
}
