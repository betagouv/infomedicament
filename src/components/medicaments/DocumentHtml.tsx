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
  const { getDefinitionModalAndUpdateGlossary } = useContext(GlossaryContext);
  const definitionsByName = useMemo(
    () => new Map(definitions?.map((definition) => [definition.nom, definition]) ?? []),
    [definitions],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll<HTMLElement>("[data-definition]").forEach((element) => {
      const name = element.dataset.definition;
      const definition = name ? definitionsByName.get(name) : undefined;
      if (!definition) return;

      element.tabIndex = 0;
      element.setAttribute("role", "button");
      element.setAttribute("aria-haspopup", "dialog");
      element.setAttribute("aria-label", `Voir la définition de ${element.textContent?.trim() || name}`);
      getDefinitionModalAndUpdateGlossary(definition);
    });
  }, [contentHtml, definitionsByName, getDefinitionModalAndUpdateGlossary]);

  const openDefinition = useCallback((element: HTMLElement) => {
    if (!containerRef.current?.contains(element)) return;

    const name = element.dataset.definition;
    const definition = name ? definitionsByName.get(name) : undefined;
    if (!definition) return;

    getDefinitionModalAndUpdateGlossary(definition).open();
  }, [definitionsByName, getDefinitionModalAndUpdateGlossary]);

  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const element = getDefinitionElement(event.target);
    if (!element) return;

    event.preventDefault();
    openDefinition(element);
  }, [openDefinition]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const element = getDefinitionElement(event.target);
    if (!element) return;

    event.preventDefault();
    openDefinition(element);
  }, [openDefinition]);

  return (
    <RcpNoticeHtmlContainer
      {...props}
      className={[className, "document-html--definitions"].filter(Boolean).join(" ")}
      ref={containerRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}
