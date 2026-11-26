"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import {
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import styled, { keyframes } from "styled-components";
import { RcpNoticeHtmlContainer } from "../blocks/GenericBlocks";
import type { NoticeSearchResponse } from "@/types/NoticeSearch";
import {
  clearNoticeQuoteHighlights,
  highlightNoticeQuote,
} from "@/utils/noticeQuoteSource";

const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: var(--background-alt-blue-france);
  filter: drop-shadow(var(--raised-shadow));
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingStatus = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingSpinner = styled.span`
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  border: 2px solid var(--border-default-grey);
  border-top-color: var(--text-action-high-blue-france);
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Excerpts = styled.div`
  max-height: 55vh;
  overflow: auto;
  overscroll-behavior: contain;
  article + article {
    border-top: 1px solid var(--border-default-grey);
    margin-top: 1rem;
    padding-top: 1rem;
  }
  table {
    width: max-content;
    max-width: 100%;
  }
  blockquote {
    margin: 0.5rem 0 1rem;
    padding-left: 1rem;
    border-left: 3px solid var(--border-open-blue-france);
  }
  blockquote p:last-child {
    margin-bottom: 0;
  }
`;

const messages = {
  insufficient_evidence:
    "Nous n’avons pas identifié de passage répondant suffisamment précisément à votre question. Vous pouvez consulter la notice complète ci-dessous.",
  unavailable: "La notice n’est pas disponible pour cette recherche.",
  error:
    "La recherche dans la notice n’a pas pu aboutir. Veuillez réessayer ou consulter la notice complète ci-dessous.",
};

interface NoticeChunkResultsBoxProps extends HTMLAttributes<HTMLDivElement> {
  result: NoticeSearchResponse | null;
  loading: boolean;
  questionLabel?: ReactNode;
  onClose: () => void;
}

export default function NoticeChunkResultsBox({
  result,
  loading,
  questionLabel,
  onClose,
  ...props
}: NoticeChunkResultsBoxProps) {
  const highlighted = useRef<HTMLElement[]>([]);
  const clearHighlights = useCallback(() => {
    clearNoticeQuoteHighlights(highlighted.current);
    highlighted.current = [];
  }, []);

  useEffect(() => {
    clearHighlights();
    return clearHighlights;
  }, [result, clearHighlights]);

  return (
    <Container {...props} aria-busy={loading}>
      <div className={fr.cx("fr-p-1w")}>
        <Header>
          <strong className={fr.cx("fr-text--sm")}>
            {questionLabel ?? "Recherche dans la notice"}
          </strong>
          <Button
            iconId="fr-icon-close-line"
            onClick={onClose}
            priority="tertiary no outline"
            title="Fermer"
          />
        </Header>
        {loading && (
          <LoadingStatus role="status">
            <LoadingSpinner aria-hidden="true" />
            Recherche de passages dans la notice…
          </LoadingStatus>
        )}
        {!loading && result?.status === "supported" && (
          <>
            <Excerpts
              tabIndex={0}
              role="region"
              aria-label="Extraits de la notice"
            >
              {result.passages
                .flatMap((passage) =>
                  passage.quotes.map((quote) => ({ passage, quote })),
                )
                .map(({ passage, quote }, index) => {
                  const target = quote.target ?? passage.target;
                  const fragment = `#${encodeURIComponent(target.anchor || "noticeContainer")}`;
                  return (
                    <article
                      key={quote.id}
                      aria-label={
                        quote.headingPath.join(" — ") || "Extrait de la notice"
                      }
                    >
                      <blockquote>
                        <RcpNoticeHtmlContainer
                          dangerouslySetInnerHTML={{ __html: quote.html }}
                        />
                      </blockquote>
                      <a
                        className={fr.cx("fr-link", "fr-text--sm")}
                        href={fragment}
                        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                          if (
                            event.button !== 0 ||
                            event.metaKey ||
                            event.ctrlKey ||
                            event.shiftKey ||
                            event.altKey
                          )
                            return;
                          const notice =
                            document.getElementById("noticeContainer");
                          if (!notice) return;
                          clearHighlights();
                          const { highlights, scrollTarget } =
                            highlightNoticeQuote(notice, quote, target);
                          highlighted.current = highlights;
                          if (scrollTarget) {
                            event.preventDefault();
                            if (window.location.hash !== fragment)
                              window.history.pushState(null, "", fragment);
                            scrollTarget.scrollIntoView({ block: "center" });
                          }
                        }}
                      >
                        Source [{index + 1}] — Voir dans la notice
                      </a>
                    </article>
                  );
                })}
            </Excerpts>
          </>
        )}
        {!loading && result && result.status in messages && (
          <p role="status" className={fr.cx("fr-text--sm")}>
            {messages[result.status as keyof typeof messages]}
          </p>
        )}
      </div>
    </Container>
  );
}
