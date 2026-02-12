"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled from 'styled-components';
import Link from "next/link";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Asmr, FicheInfos, Smr } from "@/types/SpecialiteTypes";

const DocBonUsage = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

interface DocumentHasProps extends HTMLAttributes<HTMLDivElement> {
  ficheInfos?: FicheInfos;
}

function getSmrAsmrFormattedValeur(value: string) {
  if(value.trim() === "V")
    return (<span>V&nbsp;(Inexistant)</span>);
  return value;
}

function getSmrAsmrFormattedAvis(date?: Date, link?: string | null) {
  const formattedDate = date ? new Date(date) : "";
  if(formattedDate){
    if(link)
      return (
        <Link 
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          title={`Lien vers l'avis complet de la commission de la transparence du ${formattedDate.toLocaleDateString('fr-FR')} - nouvelle fenêtre vers le site de la HAS`}
          className={fr.cx("fr-link", "fr-link--sm")}
        >
          Avis&nbsp;du {formattedDate.toLocaleDateString('fr-FR')}
        </Link>
      );
    return formattedDate.toLocaleDateString('fr-FR');
  }
  return "";
}

function DocumentHas({ 
  ficheInfos,
  ...props 
}: DocumentHasProps) {
  return (
    <>
      <ContentContainer id="document-has-bon-usage" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Documents de bon usage</h2>
        {(ficheInfos && ficheInfos.listeDocumentsBonUsage && ficheInfos.listeDocumentsBonUsage.length > 0) 
          ? (
            <>
              {ficheInfos && ficheInfos.listeDocumentsBonUsage.map((document, index) => {
                const date = document.DateMAJ ? new Date(document.DateMAJ) : "";
                return (
                  <DocBonUsage key={index} className={fr.cx("fr-text--sm", "fr-mb-1w")}>
                    {document.Url && (
                      <Link 
                        href={document.Url}
                        target="_blank"
                        className={fr.cx("fr-mb-2w")}
                        rel="noopener noreferrer"
                      >
                        {document.TitreDoc}
                      </Link>
                    )}
                    <div className={fr.cx("fr-mt-1w")}>
                      {date && (<i className={fr.cx("fr-text--xs", "fr-mb-0")} style={{textTransform:"capitalize"}}>{date.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}</i>)}
                      {document.TypeDoc && (<Badge className={fr.cx("fr-badge--purple-glycine")} small>{document.TypeDoc}</Badge>)}
                    </div>
                  </DocBonUsage>
                );
              })}
            </>
          ) : (
            <span>Il n&rsquo;y a pas de documents de bon usage disponible pour ce médicament.</span>
          )
        }
      </ContentContainer>

      <ContentContainer id="document-has-smr" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Service médical rendu (SMR)</h2>
        {(ficheInfos && ficheInfos.listeSMR && ficheInfos.listeSMR.length > 0) 
          ? (
            <div className={fr.cx("fr-mb-0")}>
              {" Les libellés affichés ci-dessous ne sont que des résumés ou extraits issus des avis rendus par la Commission de la Transparence. Seul l'avis complet de la Commission de la Transparence fait référence."}
              <br/><br/>
              {"Cet avis est consultable à partir du lien \"Avis du jj/mm/aaaa\" ou encore sur demande auprès de la HAS ("}<Link href="https://base-donnees-publique.medicaments.gouv.fr/aide#comment-acceder-a-avis-de-la-commission-de-la-transparence" target="_blank" rel="noopener noreferrer">{"plus d'informations dans l'aide"}</Link>{"). Les avis et synthèses d'avis contiennent un paragraphe sur la place du médicament dans la stratégie thérapeutique."}
              <br/>
              <Table
                headers={[
                  "Valeur du SMR",
                  "Avis",
                  "Motif de l'évaluation",
                  "Résumé de l'avis"
                ]}
                data={
                  ficheInfos.listeSMR.map((smr: Smr, index) => {
                    return [
                      getSmrAsmrFormattedValeur(smr.ValeurSmr),
                      getSmrAsmrFormattedAvis(smr.DateAvis, smr.HASLiensPageCT),
                      smr.MotifEval,
                      (<div key={index} dangerouslySetInnerHTML={{__html: smr.LibelleSmr}} className={fr.cx("fr-text--sm", "fr-mb-0")}></div>)
                    ];
                  })
                }
              />
            </div>
          ) : (
            <span>Il n&rsquo;y a pas de SMR disponible pour ce médicament.</span>
          )
        }
      </ContentContainer>
      
      <ContentContainer id="document-has-asmr" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Amélioration du service médical rendu (ASMR)</h2>
        {(ficheInfos && ficheInfos.listeASMR && ficheInfos.listeASMR.length > 0) 
          ? (
            <div className={fr.cx("fr-mb-0")}>
              {" Les libellés affichés ci-dessous ne sont que des résumés ou extraits issus des avis rendus par la Commission de la Transparence. Seul l'avis complet de la Commission de la Transparence fait référence."}
              <br/><br/>
              {"Cet avis est consultable à partir du lien \"Avis du jj/mm/aaaa\" ou encore sur demande auprès de la HAS ("}<Link href="https://base-donnees-publique.medicaments.gouv.fr/aide#comment-acceder-a-avis-de-la-commission-de-la-transparence" target="_blank" rel="noopener noreferrer">{"plus d'informations dans l'aide"}</Link>{"). Les avis et synthèses d'avis contiennent un paragraphe sur la place du médicament dans la stratégie thérapeutique."}
              <br/>
              <Table
                headers={[
                  "Valeur de l'ASMR",
                  "Avis",
                  "Motif de l'évaluation",
                  "Résumé de l'avis"
                ]}
                data={
                  ficheInfos.listeASMR.map((asmr: Asmr, index) => {
                    return [
                      getSmrAsmrFormattedValeur(asmr.ValeurAsmr),
                      getSmrAsmrFormattedAvis(asmr.DateAvis, asmr.HASLiensPageCT),
                      asmr.MotifEval,
                      (<div key={index} dangerouslySetInnerHTML={{__html: asmr.LibelleAsmr}} className={fr.cx("fr-text--sm", "fr-mb-0")}></div>)
                    ];
                  })
                }
              />
            </div>
          ) : (
            <span>Il n&rsquo;y a pas d&rsquo;ASMR disponible pour ce médicament.</span>
          )
        }
      </ContentContainer>
    </>
  );
};

export default DocumentHas;
