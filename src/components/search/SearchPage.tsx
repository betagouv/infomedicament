"use client";

import { fr } from "@codegouvfr/react-dsfr";
import styled from "styled-components";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import ContentContainer from "@/components/generic/ContentContainer";
import SearchResultsList from "@/components/search/SearchResultsList";
import { HTMLAttributes, useState } from "react";
import Link from "next/link";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { SearchResultItem } from "@/types/SearchTypes";
import { formatSpecName } from "@/displayUtils";
import type { SmartSearchCandidate, SmartSearchResponse } from "@/types/SmartSearchTypes";

const CandidateLink = styled(Link)<{ $selected: boolean; $pending: boolean }>`
  display: block;
  width: 100%;
  border: 1px solid ${props => props.$selected || props.$pending ? "var(--border-action-high-blue-france)" : "var(--border-default-grey)"};
  border-radius: 4px;
  background: ${props => props.$selected || props.$pending ? "var(--background-action-low-blue-france)" : "var(--background-default-grey)"};
  color: var(--text-title-grey);
  background-image: none;
  min-height: 3.25rem;

  &:hover {
    background-color: var(--background-alt-blue-france-hover);
  }
`;

const CandidateTitle = styled.span`
  display: block;
`;

const CandidateState = styled.span`
  display: block;
  color: var(--text-action-high-blue-france);
`;

const Quote = styled.blockquote`
  margin: 0;
  padding: 0.75rem 0 0.75rem 1rem;
  border-left: 3px solid var(--border-action-high-blue-france);
  background: var(--background-default-grey);
`;

const TopPanel = styled.section<{ $tone: "info" | "warning" | "error" | "success" }>`
  border: 1px solid ${props => {
    if (props.$tone === "error") return "var(--border-plain-error)";
    if (props.$tone === "warning") return "var(--border-plain-warning)";
    if (props.$tone === "success") return "var(--border-plain-success)";
    return "var(--border-action-high-blue-france)";
  }};
  border-left-width: 6px;
  border-radius: 8px;
  background: ${props => {
    if (props.$tone === "error") return "var(--background-contrast-error)";
    if (props.$tone === "warning") return "var(--background-contrast-warning)";
    if (props.$tone === "success") return "var(--background-alt-green-emeraude)";
    return "var(--background-alt-blue-france)";
  }};
`;

const TopPanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const TopPanelTitle = styled.h2`
  margin-bottom: 0.5rem;
`;

const TopPanelMeta = styled.p`
  color: var(--text-mention-grey);
`;

interface SearchPageProps extends HTMLAttributes<HTMLDivElement> {
  search?: string;
  searchResults?: SearchResultItem[];
  smartSearch?: SmartSearchResponse;
}

function candidateLabel(candidate: SmartSearchCandidate) {
  return formatSpecName(candidate.specName);
}

function statusMessage(smartSearch?: SmartSearchResponse) {
  if (smartSearch?.status === "no_results") {
    return "Aucun médicament n’a été trouvé pour cette recherche.";
  }
  return undefined;
}

function topBlockSeverity(result: SmartSearchResponse) {
  if (result.status === "blocked" || result.status === "urgent_medical_attention") return "error" as const;
  if (result.status === "answered") return "success" as const;
  if (result.status === "needs_confirmation") return "info" as const;
  if (result.status === "no_answer" || result.status === "no_notice") return "warning" as const;
  return "warning";
}

function SearchPage({
  search,
  searchResults,
  smartSearch,
}: SearchPageProps) {
  const [pendingCandidateId, setPendingCandidateId] = useState<string | null>(null);
  const selected = smartSearch?.selectedCandidate;
  const hit = smartSearch?.hits[0];
  const showCandidates = smartSearch?.candidates && smartSearch.candidates.length > 0 && smartSearch.status !== "results";
  const message = statusMessage(smartSearch);

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-mt-4w", "fr-mb-3w")}>
        <AutocompleteSearch
          inputName="s"
          initialValue={search}
        />
      </div>

      {message && (
        <div className={fr.cx("fr-grid-row", "fr-mb-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            {message}
          </div>
        </div>
      )}

      {smartSearch?.topBlock && (
        <TopPanel $tone={topBlockSeverity(smartSearch)} className={fr.cx("fr-p-3w", "fr-mb-4w")}>
          <TopPanelHeader>
            <div>
              <TopPanelTitle>{smartSearch.topBlock.title}</TopPanelTitle>
              <p className={fr.cx("fr-mb-1w")}>{smartSearch.topBlock.message}</p>
            </div>
            {selected && <Badge severity="success">Notice retenue</Badge>}
          </TopPanelHeader>

          {selected && (
            <TopPanelMeta className={fr.cx("fr-text--sm", "fr-mb-2w")}>
              Recherche dans{" "}
              <Link href={`/medicaments/${selected.specId}`}>
                <strong>{candidateLabel(selected)}</strong>
              </Link>
              {" "}· Question comprise : {smartSearch.extraction.question}
            </TopPanelMeta>
          )}

          {hit?.answer && (
            <>
              <Quote className={fr.cx("fr-mb-2w")}>
                <p className={fr.cx("fr-text--lg", "fr-mb-1w")}>&laquo; {hit.answer} &raquo;</p>
              </Quote>
              <p className={fr.cx("fr-text--sm", "fr-mb-0")}>
                {hit.sub_header && <>Sous-partie : <strong>{hit.sub_header}</strong>. </>}
                {hit.block_id && <>Bloc : <strong>{hit.block_id}</strong>. </>}
                {selected && (
                  <Link href={`/medicaments/${selected.specId}`}>
                    Ouvrir la notice
                  </Link>
                )}
              </p>
            </>
          )}

          {showCandidates && search && (
            <div className={fr.cx("fr-mt-2w")}>
              <h3 className={fr.cx("fr-h6", "fr-mb-2w")}>
                {smartSearch.status === "needs_confirmation" ? "Choisir la notice" : "Autres notices possibles"}
              </h3>
              {pendingCandidateId && (
                <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
                  Notice sélectionnée. Recherche de l’extrait en cours…
                </p>
              )}
              <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
                {smartSearch.candidates.map((candidate) => {
                  const isPending = candidate.specId === pendingCandidateId;
                  const isSelected = candidate.specId === selected?.specId;
                  return (
                    <div className={fr.cx("fr-col-12", "fr-col-md-6")} key={candidate.specId}>
                      <CandidateLink
                        href={`/rechercher?s=${encodeURIComponent(search)}&selectedSpecId=${encodeURIComponent(candidate.specId)}`}
                        $selected={isSelected}
                        $pending={isPending}
                        className={fr.cx("fr-p-1w")}
                        aria-current={isSelected ? "true" : undefined}
                        onClick={() => setPendingCandidateId(candidate.specId)}
                      >
                        <CandidateTitle>
                          <strong>{candidateLabel(candidate)}</strong>
                        </CandidateTitle>
                        {(isPending || isSelected) && (
                          <CandidateState className={fr.cx("fr-text--sm")}>
                            {isPending ? "Sélectionnée, recherche en cours…" : "Notice sélectionnée"}
                          </CandidateState>
                        )}
                      </CandidateLink>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TopPanel>
      )}

      {searchResults && searchResults.length > 0 ? (
        <SearchResultsList
          resultsList={searchResults}
          search={search}
        />
      ) : (
        <div className={fr.cx("fr-grid-row", "fr-mt-3w")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            Il n’y a aucun résultat.
          </div>
        </div>
      )}
    </ContentContainer>
  );
}

export default SearchPage;
