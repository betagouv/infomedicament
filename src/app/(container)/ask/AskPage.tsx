"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import ContentContainer from "@/components/generic/ContentContainer";
import { RcpNoticeContainer } from "@/components/medicaments/blocks/GenericBlocks";
import type { NoticeChunkHit, QueryAnalysis } from "@/app/(container)/ask/search/route";
import { FormEvent, useState } from "react";
import styled from "styled-components";

const DebugAccordion = styled(Accordion)`
  color: var(--text-mention-grey);
  font-size: 0.75rem;

  pre {
    font-size: 0.7rem;
    color: var(--text-mention-grey);
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NoticeChunkHit[]>([]);
  const [analysis, setAnalysis] = useState<QueryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [irrelevant, setIrrelevant] = useState(false);
  const [dangerous, setDangerous] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setHits([]);
    setAnalysis(null);
    setIrrelevant(false);
    setDangerous(false);
    try {
      const res = await fetch(
        `/ask/search?q=${encodeURIComponent(query.trim())}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHits(data.hits);
      setAnalysis(data.analysis ?? null);
      setIrrelevant(data.irrelevant ?? false);
      setDangerous(data.dangerous ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const indirectEntities = analysis
    ? [...analysis.substances, ...analysis.pathologies, ...analysis.atc_classes]
    : [];

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-mt-4w")}>
          <h1>Recherche sémantique (POC)</h1>
          <form onSubmit={handleSubmit}>
            <div className={fr.cx("fr-input-group")}>
              <label className={fr.cx("fr-label")} htmlFor="ask-input">
                Posez une question sur un médicament{" "}
                <Tooltip
                  title="Albert, l'IA souveraine de la Direction Interministérielle du Numérique, nous aide à analyser vos questions pour vous fournir les résultats les plus précis possibles. Elle peut faire des erreurs."
                  kind="hover"
                >
                  <span style={{ cursor: "help", fontSize: "0.85rem" }}>ⓘ</span>
                </Tooltip>
              </label>
              <input
                id="ask-input"
                className={fr.cx("fr-input")}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex : puis-je boire de l'alcool avec du doliprane 1000 ?"
              />
            </div>
            <button
              className={fr.cx("fr-btn", "fr-mt-2w")}
              type="submit"
              disabled={loading}
            >
              {loading ? "Recherche en cours…" : "Rechercher"}
            </button>
          </form>

          {error && (
            <p className={fr.cx("fr-error-text", "fr-mt-2w")}>{error}</p>
          )}

          {irrelevant && (
            <p className={fr.cx("fr-mt-3w")}>
              Cette question ne semble pas concerner les médicaments.
            </p>
          )}

          {dangerous && (
            <p className={fr.cx("fr-error-text", "fr-mt-3w")}>
              Si vous êtes en danger, appelez le 15 (SAMU) ou le{" "}
              <a href="tel:3114" className={fr.cx("fr-link")}>3114</a>{" "}
              (numéro national de prévention du suicide).
            </p>
          )}

          {hits.length > 0 && (
            <ul className={fr.cx("fr-mt-4w")} style={{ listStyle: "none", padding: 0 }}>
              {hits.map((hit, i) => (
                <li
                  key={i}
                  className={fr.cx("fr-mb-3w")}
                  style={{ borderLeft: "3px solid var(--border-active-blue-france)", paddingLeft: "1rem" }}
                >
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-mention-grey)" }}>
                    {hit.section_title}
                    {hit.sub_header ? ` › ${hit.sub_header}` : ""}
                  </p>
                  {hit.html_snippets?.length > 0 ? (
                    <RcpNoticeContainer
                      dangerouslySetInnerHTML={{ __html: hit.html_snippets.join("") }}
                    />
                  ) : (
                    <p style={{ margin: "0.25rem 0 0.5rem" }}>{hit.text}</p>
                  )}
                  <div className={fr.cx("fr-mt-1w")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <a href={`/medicament/${hit.cis}`} className={fr.cx("fr-link")}>
                      Voir la fiche médicament
                    </a>
                    {hit.spec_name && indirectEntities.length > 0 && (
                      <Badge severity="info" noIcon>
                        {hit.spec_name} via {indirectEntities.join(", ")}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && hits.length === 0 && query && (
            <p className={fr.cx("fr-mt-3w")}>Aucun résultat.</p>
          )}

          {analysis && (
            <DebugAccordion
              label={<>Voir comment Albert API a interprété votre requête{" "}
                <Tooltip
                  title="Albert, l'IA souveraine de la Direction Interministérielle du Numérique, nous aide à analyser vos questions pour vous fournir les résultats les plus précis possibles. Elle peut faire des erreurs."
                  kind="hover"
                >
                  <span style={{ cursor: "help", fontSize: "0.85rem" }}>ⓘ</span>
                </Tooltip>
              </>}
              className={fr.cx("fr-mt-6w")}
            >
              <pre>{JSON.stringify(analysis, null, 2)}</pre>
            </DebugAccordion>
          )}
        </div>
      </div>
    </ContentContainer>
  );
}
