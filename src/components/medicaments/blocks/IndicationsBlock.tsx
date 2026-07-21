"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled, { css } from 'styled-components';
import Link from "next/link";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { isAIP, isCentralisee } from "@/utils/specialites";
import { ShortIndication } from "@/types/IndicationsTypes";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { Definition } from "@/types/GlossaireTypes";
import DocumentHtml from "../DocumentHtml";

const IndicationBlock = styled.div<{
  $small?: boolean;
}>`
  ${props => props.$small && css`
    p {
      font-size: 0.875rem;
    }
  `}

  div, span {
    margin-bottom: 1rem;
    ${props => props.$small && css`
      font-size: 0.875rem;
    `}
    @media (max-width: 48em) {
      font-size: 0.875rem;
      margin-bottom: 0rem !important;
      .fr-text--md {
        font-size: 0.875rem !important;
      }
    }
  }
`;
const IndicationTitle = styled.h2<{
  $small?: boolean;
}>`
  ${props => props.$small ? css`
    margin-bottom: 0.5rem;
    @media (max-width: 48em) {
       margin-bottom: 1rem;
     }
  ` : css`
      margin: var(--title-spacing);
  `}
`;

const IndicationsContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

interface IndicationsBlockProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
  indications?: ShortIndication[];
  indicationsBlock?: string;
  definitions?: Definition[];
  title?: string;
  small?: boolean;
}

function IndicationsBlock({ 
  specialite,
  indications,
  indicationsBlock,
  definitions,
  title,
  small,
  ...props 
}: IndicationsBlockProps) {

  return (
    specialite && (
      <ContentContainer 
        id="informations-indications" 
        {...props} 
        whiteContainer 
        className={[props.className, fr.cx("fr-mb-2w", "fr-p-2w")].join(" ")}
      >
        <IndicationTitle 
          className={fr.cx("fr-h6")}
          $small={small}
        >
          {title ? title : "Indications"}
        </IndicationTitle>
        <IndicationBlock 
          className={fr.cx("fr-mb-0")}
          $small={small}
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
              indicationsBlock ? (
                <DocumentHtml
                  contentHtml={indicationsBlock}
                  definitions={definitions}
                />
              ) : !indications?.length ? (
                <span>Les indications thérapeutiques ne sont pas disponibles.</span>
              ) : null
            )
          )}
        </IndicationBlock>
        {indications && indications.length > 0 && (
          <IndicationsContainer>
            {indications.map((indication: ShortIndication, i: number) => (
              <Tag
                key={i}
                linkProps={{
                  href: `/indications/${indication.idIndication}`,
                  className: cx("fr-tag--custom-alt-blue"),
                  target: "_blank",
                }}
              >
                {indication.nomIndication}
              </Tag>
            ))}
          </IndicationsContainer>
        )}
      </ContentContainer>
    )
  );
};

export default IndicationsBlock;
