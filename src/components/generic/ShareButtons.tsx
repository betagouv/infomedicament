"use client";

import { trackEvent } from "@/services/tracking";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useState } from "react";
import styled, { css } from "styled-components";

const ShareContainer = styled.div<{ $alignRight?: boolean }>`
  .fr-share {
    flex-direction: row;
    align-items: center;
    ${({ $alignRight }) =>
      $alignRight &&
      css`
        justify-content: flex-end;
      `}
  }
  .fr-share .fr-share__title {
    margin-right: 0.5rem;
  }
  .fr-share .fr-btn {
    box-shadow: none;
    margin-left: 0;
    margin-right: 0;
  }
  .fr-share .fr-btns-group > li {
    align-items: center;
  }
`;

const CopiedText = styled.span`
  color: var(--text-default-success);
`;

interface ShareButtonsProps extends HTMLAttributes<HTMLDivElement> {
  pageName?: string;
  disabled?: boolean;
  alignRight?: boolean;
}

function ShareButtons({
  pageName,
  disabled = false,
  alignRight,
  ...props
}: ShareButtonsProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  return (
    <ShareContainer {...props} $alignRight={alignRight}>
      <div className={fr.cx("fr-share")}>
        <p className={fr.cx("fr-share__title")}>Partager via :</p>
        <ul className={fr.cx("fr-btns-group")}>
          <li>
            {disabled || !pageName ? (
              <button
                type="button"
                disabled
                className={fr.cx("fr-btn--mail", "fr-btn")}
              >
                Partager par email
              </button>
            ) : (
              <button
                type="button"
                className={fr.cx("fr-btn--mail", "fr-btn")}
                onClick={() => {
                  const subject = `${pageName} - Info Médicament`;
                  const body = `Voici un lien vers la page ${pageName} sur le site Info Médicament : ${window.location.href}`;
                  trackEvent("Partage", "Email");
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Partager par email
              </button>
            )}
          </li>
          <li>
            {!isCopied ? (
              <button
                type="button"
                disabled={disabled || !pageName}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(function () {
                    setIsCopied(true);
                  });
                  trackEvent("Partage", "Copie");
                }}
                className={fr.cx("fr-btn--copy", "fr-btn")}
              >
                Copier dans le presse-papier
              </button>
            ) : (
              <CopiedText
                className={fr.cx("fr-text--sm", "fr-icon-check-line")}
              >
                Lien copié
              </CopiedText>
            )}
          </li>
        </ul>
      </div>
    </ShareContainer>
  );
}

export default ShareButtons;
