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

function highlightTextInElement(el: HTMLElement, quote: string): HTMLElement | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const idx = node.textContent?.indexOf(quote) ?? -1;
    if (idx !== -1) {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + quote.length);
      const mark = document.createElement("mark");
      mark.className = "notice-highlight-quote";
      range.surroundContents(mark);
      return mark;
    }
  }
  return null;
}

interface NoticeChunkResultsBoxProps extends HTMLAttributes<HTMLDivElement> {
  hits: NoticeChunkHit[];
  loading: boolean;
  questionLabel?: ReactNode;
  onClose: () => void;
}

function NoticeChunkResultsBox({
  hits,
  loading,
  questionLabel,
  onClose,
  ...props
}: NoticeChunkResultsBoxProps) {
  const highlightedEls = useRef<Element[]>([]);

  const clearHighlights = useCallback(() => {
    highlightedEls.current.forEach((el) => {
      if (el.tagName === "MARK") {
        el.replaceWith(...el.childNodes);
      } else {
        el.classList.remove("notice-highlight");
      }
    });
    highlightedEls.current = [];
  }, []);

  const highlightAndScroll = useCallback((hit: NoticeChunkHit) => {
    clearHighlights();

    // Prefer direct block highlight over section-level anchor
    if (hit.block_id) {
      const blockEl = document.querySelector<HTMLElement>(`[data-block-id="${hit.block_id}"]`);
      if (blockEl) {
        // Try sentence-level highlight within the block first
        if (hit.quote) {
          const mark = highlightTextInElement(blockEl, hit.quote);
          if (mark) {
            highlightedEls.current.push(mark);
            mark.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
          }
        }
        blockEl.classList.add("notice-highlight");
        highlightedEls.current.push(blockEl);
        blockEl.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

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
        {hits[0]?.answer && (
          <p className={fr.cx("fr-text--sm", "fr-mb-0")}>{hits[0].answer}</p>
        )}
        {!loading && hits.length === 0 && (
          <span className={fr.cx("fr-text--sm")}>Aucun résultat trouvé dans cette notice. Essayez de consulter le RCP dans la version détaillée de la notice.</span>
        )}
      </div>
    </Container>
  );
}

export default NoticeChunkResultsBox;
