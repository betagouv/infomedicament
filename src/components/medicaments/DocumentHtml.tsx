"use client";

import {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";
import { Definition } from "@/types/GlossaireTypes";
import { RcpNoticeHtmlContainer } from "./blocks/GenericBlocks";
import { getDocumentBlockAnchor } from "@/utils/documentSourceAnchors";

interface DocumentHtmlProps extends HTMLAttributes<HTMLDivElement> {
  contentHtml: string;
  definitions?: Definition[];
}

function getDefinitionElement(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-definition]")
    : null;
}

export default function DocumentHtml({
  contentHtml,
  definitions,
  className,
  ...props
}: DocumentHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openDefinition: showDefinition } = useContext(GlossaryContext);
  const definitionsByName = useMemo(
    () =>
      new Map(
        definitions?.map((definition) => [definition.nom, definition]) ?? [],
      ),
    [definitions],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const seenAnchors = new Set<string>();
    const addedAnchors = new Map<string, HTMLElement>();
    container
      .querySelectorAll<HTMLElement>("[id], [name], [data-block-id]")
      .forEach((element) => {
        const anchor =
          element.getAttribute("id") ?? element.getAttribute("name");
        const blockId = element.dataset.blockId;
        if (blockId && (!anchor || seenAnchors.has(anchor))) {
          const id = getDocumentBlockAnchor(blockId);
          element.id = id;
          addedAnchors.set(id, element);
        }
        for (const attribute of ["id", "name"]) {
          const value = element.getAttribute(attribute);
          if (value) seenAnchors.add(value);
        }
      });
    // Copied links/new tabs may target anchors added after initial HTML parsing.
    addedAnchors.forEach((element, id) => {
      if (window.location.hash === `#${encodeURIComponent(id)}`)
        element.scrollIntoView({ block: "start" });
    });
  }, [contentHtml]);

  const openDefinition = useCallback(
    (element: HTMLElement) => {
      if (!containerRef.current?.contains(element)) return;

      const name = element.dataset.definition;
      const definition = name ? definitionsByName.get(name) : undefined;
      if (!definition) return;

      showDefinition(definition, element);
    },
    [definitionsByName, showDefinition],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const element = getDefinitionElement(event.target);
      if (!element) return;

      event.preventDefault();
      openDefinition(element);
    },
    [openDefinition],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const element = getDefinitionElement(event.target);
      if (!element) return;

      event.preventDefault();
      openDefinition(element);
    },
    [openDefinition],
  );

  return (
    <RcpNoticeHtmlContainer
      {...props}
      className={[className, "document-html--definitions"]
        .filter(Boolean)
        .join(" ")}
      ref={containerRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
