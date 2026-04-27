"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import type { NoticeChunkHit } from "@/app/(container)/ask/search/route";
import { FormEvent, useState } from "react";

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NoticeChunkHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setHits([]);
    try {
      const res = await fetch(
        `/ask/search?q=${encodeURIComponent(query.trim())}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHits(data.hits);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-mt-4w")}>
          <h1>Recherche sémantique (POC)</h1>
          <form onSubmit={handleSubmit}>
            <div className={fr.cx("fr-input-group")}>
              <label className={fr.cx("fr-label")} htmlFor="ask-input">
                Posez une question sur un médicament
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
                  <p style={{ margin: "0.25rem 0 0.5rem" }}>{hit.text}</p>
                  <a href={`/medicament/${hit.cis}`} className={fr.cx("fr-link")}>
                    Voir la fiche médicament ({hit.cis})
                  </a>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && hits.length === 0 && query && (
            <p className={fr.cx("fr-mt-3w")}>Aucun résultat.</p>
          )}
        </div>
      </div>
    </ContentContainer>
  );
}
