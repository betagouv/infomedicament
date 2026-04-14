"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled from 'styled-components';
import Link from "next/link";
import { DetailedSpecialite, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { getContent } from "@/utils/notices/noticesUtils";
import { isAIP, isCentralisee } from "@/utils/specialites";

const IndicationBlock = styled.div`
  div {
    margin-bottom: 1rem;
    @media (max-width: 48em) {
      font-size: 0.875rem;
      margin-bottom: 0rem;
      .fr-text--md {
        font-size: 0.875rem !important;
      }
    }
  }
`;

const IndicationTitle = styled.h2`
  @media (max-width: 48em) {
    font-size: 1.5rem !important;
  }
`;

interface IndicationsBlockProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
  indicationBlock?: NoticeRCPContentBlock;
}

function IndicationsBlock({ 
  specialite,
  indicationBlock,
  ...props 
}: IndicationsBlockProps) {

  return (
    specialite && (
      <ContentContainer 
        id="informations-indications" 
        {...props} 
        whiteContainer 
        className={[props.className, fr.cx("fr-mb-4w", "fr-p-2w")].join(" ")}
      >
        <IndicationTitle className={fr.cx("fr-h6")}>Indications</IndicationTitle>
        <IndicationBlock className={fr.cx("fr-mb-0")}>
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
                    <Link href={specialite.urlCentralise} 
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
                <div>{getContent(indicationBlock.children)}</div>
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
