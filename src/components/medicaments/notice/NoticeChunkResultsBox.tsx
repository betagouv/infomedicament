"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { HTMLAttributes, ReactNode, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { NoticeChunkHit } from "@/app/(container)/medicaments/[CIS]/notice-search/route";

const Container = styled.div`
  position: sticky;
  top: 8px;
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: var(--background-alt-blue-france);
  z-index: 5;
  filter: drop-shadow(var(--raised-shadow));
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const QuestionLabel = styled.span`
  font-weight: bold;
  font-size: 14px;
`;

interface NoticeChunkResultsBoxProps extends HTMLAttributes<HTMLDivElement> {
  hits: NoticeChunkHit[];
  questionLabel?: ReactNode;
  onClose: () => void;
}

function NoticeChunkResultsBox({
  hits,
  questionLabel,
  onClose,
  ...props
}: NoticeChunkResultsBoxProps) {
  const highlightedEls = useRef<Element[]>([]);

  const clearHighlights = useCallback(() => {
    highlightedEls.current.forEach((el) => el.classList.remove("notice-highlight"));
    highlightedEls.current = [];
  }, []);

  const highlightAndScroll = useCallback((hit: NoticeChunkHit) => {
    clearHighlights();
    const sectionEl = document.getElementById(hit.section_anchor);
    if (!sectionEl) return;

    // Section anchor is on the <h3>; content lives in the next sibling div
    const contentEl = (sectionEl.nextElementSibling ?? sectionEl) as HTMLElement;

    let scrollTarget: HTMLElement = sectionEl as HTMLElement;

    if (hit.sub_header) {
      for (const b of contentEl.querySelectorAll<HTMLElement>("b")) {
        if (b.textContent?.trim() === hit.sub_header.trim()) {
          b.classList.add("notice-highlight");
          highlightedEls.current.push(b);
          scrollTarget = b;
          break;
        }
      }
    } else {
      contentEl.classList.add("notice-highlight");
      highlightedEls.current.push(contentEl);
      scrollTarget = contentEl;
    }

    scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [clearHighlights]);

  // Auto-highlight first hit when hits change
  useEffect(() => {
    if (hits.length > 0) highlightAndScroll(hits[0]);
  }, [hits, highlightAndScroll]);

  // Clean up highlights on unmount
  useEffect(() => () => clearHighlights(), [clearHighlights]);

  return (
    <Container className={props.className} {...props}>
      <div className={fr.cx("fr-p-1w")}>
        <Header>
          <QuestionLabel>{questionLabel ?? "Recherche"}</QuestionLabel>
          <Button
            iconId="fr-icon-close-line"
            onClick={onClose}
            priority="tertiary no outline"
            title="Fermer"
          />
        </Header>
      </div>
    </Container>
  );
}

export default NoticeChunkResultsBox;
