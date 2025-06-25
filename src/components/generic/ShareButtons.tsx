
"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import { HTMLAttributes } from "react";
import styled, { css } from 'styled-components';

const Container = styled.div<{$leftAlign?: boolean }> `
  .fr-share {
    flex-direction: row;
    align-items: center;
    ${props => props.$leftAlign && css`
      justify-content: flex-end;
    `}
  }
  .fr-share .fr-share__title{
    margin-right: 0.5rem;
  }
  .fr-share .fr-btn {
    box-shadow: none;
    margin-left: 0px;
    margin-right: 0px;
  }
`;

interface ShareButtonsProps extends HTMLAttributes<HTMLDivElement> {
  leftAlign?: boolean;
}


function ShareButtons({leftAlign, ...props}: ShareButtonsProps) {

  return (
    <Container $leftAlign={leftAlign} className={props.className}>
      <div className={fr.cx("fr-share")}>
        <p className={fr.cx("fr-share__title")}>Partager via :</p>
        <ul className={fr.cx("fr-btns-group")}>
          <li>
            <Link 
              href={`mailto:?subject=[À MODIFIER - objet du mail]&body=[À MODIFIER - titre ou texte descriptif de la page] ${window.location.href}`}
              target="_blank" 
              rel="noopener external" 
              className={fr.cx("fr-btn--mail", "fr-btn")}
            >
              Partager par email
            </Link>
          </li>
          <li>
            <Link 
              onClick={() =>{
                navigator.clipboard.writeText(window.location.href).then(
                  function() {
                    alert('Adresse copiée dans le presse papier.')
                  }
                )}
              }
              className={fr.cx("fr-btn--copy", "fr-btn")}
              href=""
            >
              Copier dans le presse-papier
            </Link>
          </li>
        </ul>
      </div>
    </Container>
  );
};

export default ShareButtons;
