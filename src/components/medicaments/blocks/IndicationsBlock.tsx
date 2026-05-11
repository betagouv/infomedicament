"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useState } from "react";
import styled, { css } from 'styled-components';
import Link from "next/link";
import { DetailedSpecialite, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { getContent } from "@/utils/notices/noticesUtils";
import { isAIP, isCentralisee } from "@/utils/specialites";

const IndicationBlock = styled.div<{
  $small?: boolean;
}>`
  div, span {
    margin-bottom: 1rem;
    @media (max-width: 48em) {
      font-size: 0.875rem;
      margin-bottom: 0rem !important;
      .fr-text--md {
        font-size: 0.875rem !important;
      }
    }
  }
`;

const IndicationBlockContent = styled.div<{
  $isFullHeight?: boolean;
}>`
  ${props => props.$isFullHeight ? css`
    height: 100%;
  ` : css`
    height: 200px;
    overflow: hidden;
    @media (max-width: 48em) {
      height: 120px;
    }
  `}
`;

interface IndicationsBlockProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
  indicationBlock?: NoticeRCPContentBlock;
  title?: string;
  resizable?: boolean;
}

function IndicationsBlock({ 
  specialite,
  indicationBlock,
  title,
  resizable,
  ...props 
}: IndicationsBlockProps) {

  const [isFullHeight, setIsFullHeight] = useState<boolean>(false);

  return (
    specialite && (
      <ContentContainer 
        id="informations-indications" 
        {...props} 
        whiteContainer 
        className={[props.className, fr.cx("fr-mb-2w", "fr-p-2w")].join(" ")}
      >
        <h2 className={fr.cx("fr-h6")}>{title ? title : "Indications"}</h2>
        <IndicationBlock 
          className={fr.cx("fr-mb-0")}
        >
          {(specialite && isAIP(specialite)) ? (
            <span>              
              Pour visualiser les indications thérapeutiques, consulter la fiche info de la spécialité de réfèrence de cette autorisation d'importation parallèle
              {(specialite.generiqueName && specialite.SpecGeneId) && (
                <>
                  &nbsp;:&nbsp;
                  <Link
                    href={`/medicaments/${specialite.SpecGeneId}`}
                    aria-description="Lien vers le médicament"
                  >
                    {specialite.generiqueName}
                  </Link>
                </>
              )}.
            </span>
          ) : (
            (specialite && isCentralisee(specialite)) ? (
              <span>
                Vous trouverez les indications thérapeutiques de ce médicament dans le paragraphe 4.1 du RCP ou dans le paragraphe 1 de la notice. 
                {specialite.urlCentralise && (
                  <span>
                    {" "}Ces documents sont disponibles{" "}
                    <Link 
                      href={specialite.urlCentralise} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      en cliquant ici.
                    </Link>
                  </span>
                )}
              </span>
            ) : (
              (indicationBlock && indicationBlock.children && indicationBlock.children.length > 0) ? (
                <div>
                  <IndicationBlockContent $isFullHeight={resizable ? isFullHeight : true}>
                    {getContent(indicationBlock.children)}
                  </IndicationBlockContent>
                  {(resizable && !isFullHeight) && (<span>{"..."}<br/></span>)}
                  {resizable && (
                    <Link 
                      href=""
                      onClick={() => setIsFullHeight(!isFullHeight)}
                      className={fr.cx("fr-link", "fr-text--bold", "fr-text--sm")}
                    >
                        {isFullHeight ? 'Lire moins' : 'Lire plus'}
                    </Link>
                  )}
                </div>
              ) : (
                <span>Les indications thérapeutiques ne sont pas disponibles.</span>
              )
            )
          )}
        </IndicationBlock>
      </ContentContainer>
    )
  );
};

export default IndicationsBlock;
