"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import { HTMLAttributes, useEffect, useState } from "react";
import styled, { css } from 'styled-components';

const Container = styled.div`
  .fr-share {
    flex-direction: row;
    align-items: center;
  }
  .fr-share .fr-share__title{
    margin-right: 0.5rem;
  }
  .fr-share .fr-btn {
    box-shadow: none;
    margin-left: 0px;
    margin-right: 0px;
  }
  .fr-share .fr-btns-group > li {
    align-items: center;
  }
`;

const CopiedText = styled.span`
  color: var(--text-default-success);
`;

interface ShareButtonsProps extends HTMLAttributes<HTMLDivElement> {
  pageName: string;
}

function ShareButtons({
  pageName,
  ...props
}: ShareButtonsProps) {

  const [currentHref, setCurrentHref] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if(typeof window !== 'undefined')
      setCurrentHref(window.location.href);
  }, [setCurrentHref]);

  return (
    <Container className={props.className}>
      <div className={fr.cx("fr-share")}>
        <p className={fr.cx("fr-share__title")}>Partager via :</p>
        <ul className={fr.cx("fr-btns-group")}>
          <li>
            <Link 
              href={`mailto:?subject=${pageName} - Info Médicament&body=Voici un lien vers la page ${pageName} sur le site Info Médicament : ${currentHref}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className={fr.cx("fr-btn--mail", "fr-btn")}
            >
              Partager par email
            </Link>
          </li>
          <li>
            {!isCopied 
              ? ( <Link 
                  onClick={() => {
                    navigator.clipboard.writeText(currentHref).then(
                      function() {
                        setIsCopied(true);
                      }
                    )}
                  }
                  className={fr.cx("fr-btn--copy", "fr-btn")}
                  href=""
                >
                  Copier dans le presse-papier
                </Link>
              ) : (<CopiedText className={fr.cx("fr-text--sm", "fr-icon-check-line")}>Lien copié</CopiedText>)
            }
          </li>
        </ul>
      </div>
    </Container>
  );
};

export default ShareButtons;
