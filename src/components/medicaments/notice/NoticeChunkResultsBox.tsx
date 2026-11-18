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
import type {
  NoticeQuote,
  NoticeSearchResponse,
  NoticeSourceTarget,
} from "@/types/NoticeSearch";

function groupAdjacentQuotes(quotes: NoticeQuote[]): NoticeQuote[][] {
  const groups: NoticeQuote[][] = [];
  for (const quote of quotes) {
    const group = groups.at(-1);
    const previous = group?.at(-1);
    if (
      group &&
      previous?.sourceRange &&
      quote.sourceRange &&
      quote.sourceRange.start <= previous.sourceRange.end &&
      JSON.stringify(previous.headingPath) === JSON.stringify(quote.headingPath)
    ) {
      group.push(quote);
    } else {
      groups.push([quote]);
    }
  }
  return groups;
}

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
    highlighted.current.forEach((element) =>
      element.classList.remove("notice-highlight"),
    );
    highlighted.current = [];
  }, []);

  const highlightSource = useCallback(
    (target: NoticeSourceTarget = {}) => {
      clearHighlights();
      const notice = document.getElementById("noticeContainer");
      if (!notice) return;
      // Search only the full leaflet, never a copied excerpt. Avoid interpolating selectors.
      const targets = Array.from(
        notice.querySelectorAll<HTMLElement>("[id], [name], [data-block-id]"),
      );
      const element =
        (target.blockId
          ? targets.find(
              (element) => element.dataset.blockId === target.blockId,
            )
          : undefined) ??
        targets.find(
          (element) =>
            target.anchor &&
            (element.id === target.anchor ||
              element.getAttribute("name") === target.anchor),
        );
      if (element) {
        element.classList.add("notice-highlight");
        highlighted.current.push(element);
      }
    },
    [clearHighlights],
  );

  const highlightSourceLink = (
    event: MouseEvent<HTMLAnchorElement>,
    target: NoticeSourceTarget = {},
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    // Let the browser navigate the fragment and update history like any page link.
    highlightSource(target);
  };

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
              {result.passages.map((passage, index) => (
                <article
                  key={passage.id}
                  aria-label={
                    passage.headingPath.join(" — ") || "Extrait de la notice"
                  }
                >
                  {groupAdjacentQuotes(passage.quotes).map(
                    (group, groupIndex, groups) => (
                      <div key={group[0].id}>
                        {(groupIndex === 0 ||
                          JSON.stringify(
                            groups[groupIndex - 1][0].headingPath,
                          ) !== JSON.stringify(group[0].headingPath)) && (
                          <p className={fr.cx("fr-text--sm", "fr-mb-1w")}>
                            {group[0].headingPath.length ? (
                              <>
                                Dans la rubrique « {group[0].headingPath.at(-1)}{" "}
                                », la notice indique :
                              </>
                            ) : (
                              "La notice indique :"
                            )}
                          </p>
                        )}
                        <blockquote>
                          <RcpNoticeHtmlContainer
                            dangerouslySetInnerHTML={{
                              __html: group.map((quote) => quote.html).join(""),
                            }}
                          />
                        </blockquote>
                      </div>
                    ),
                  )}
                  <a
                    className={fr.cx("fr-link", "fr-text--sm")}
                    href={`#${encodeURIComponent(passage.target.anchor || "noticeContainer")}`}
                    onClick={(event) =>
                      highlightSourceLink(event, passage.target)
                    }
                  >
                    Source [{index + 1}] — Voir dans la notice
                  </a>
                </article>
              ))}
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
