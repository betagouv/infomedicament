"use client";

import { SkipLinks } from "@codegouvfr/react-dsfr/SkipLinks";
import type { MouseEvent } from "react";

export default function KeyboardSkipLinks() {
  function focusSearch(event: MouseEvent<HTMLDivElement>) {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('a[href="#search"]')
    ) {
      return;
    }

    const target = document.getElementById("search");
    const input =
      target instanceof HTMLInputElement
        ? target
        : target?.querySelector<HTMLInputElement>("input");
    if (!input) return;
    event.preventDefault();

    // On small screens the header search is inside a DSFR modal.
    const openButton = document.getElementById("fr-header-search-button");
    if (
      input.closest(".fr-header__search") &&
      openButton?.getClientRects().length
    ) {
      openButton.click();
      requestAnimationFrame(() => input.focus());
      return;
    }

    input.focus();
  }

  return (
    <div onClickCapture={focusSearch}>
      <SkipLinks
        links={[
          { label: "Accéder au contenu", anchor: "#main-content" },
          { label: "Accéder à la recherche", anchor: "#search" },
        ]}
      />
    </div>
  );
}
