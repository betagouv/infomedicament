"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled from 'styled-components';
import Link from "next/link";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";

const DocBonUsage = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 1.5rem 1rem;

  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

interface DocumentHasProps extends HTMLAttributes<HTMLDivElement> {}

function DocumentHas({ 
  ...props 
}: DocumentHasProps) {

  return (
    <>
      <ContentContainer id="document-has-bon-usage" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Documents de bon usage</h2>
        <DocBonUsage className={fr.cx("fr-text--sm")}>
          <Link href="#" target="_blank" className={fr.cx("fr-mb-2w")}>
            {"Choix et durée de l'antibiothérapie : Femme enceine : colonisation urinaire et cystite"}
          </Link>
          <div className={fr.cx("fr-mt-1w")}>
            <i className={fr.cx("fr-text--xs", "fr-mb-0")}>Octobre 2016</i>
            <Badge className={fr.cx("fr-badge--purple-glycine")} small>Recommandation bonne pratique</Badge>
          </div>
        </DocBonUsage>
        <DocBonUsage>
          <Link href="#" target="_blank" className={fr.cx("fr-text--sm")}>
            {"Choix et durée de l'antibiothérapie : Cystite aiguë simple, à risque de complication ou récidivante, de la femme"}
          </Link>
          <div className={fr.cx("fr-mt-1w")}>
            <i className={fr.cx("fr-text--xs", "fr-mb-0")}>Octobre 2016</i>
            <Badge className={fr.cx("fr-badge--purple-glycine")} small>Recommandation bonne pratique</Badge>
          </div>
        </DocBonUsage>
      </ContentContainer>

      <ContentContainer id="document-has-smr" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Service médical rendu (SMR)</h2>
        <div className={fr.cx("fr-text--sm", "fr-mb-0")}>
          {" Les libellés affichés ci-dessous ne sont que des résumés ou extraits issus des avis rendus par la Commission de la Transparence. Seul l'avis complet de la Commission de la Transparence fait référence."}
          <br/><br/>
          {"Cet avis est consultable à partir du lien \"Avis du jj/mm/aaaa\" ou encore sur demande auprès de la HAS ("}<Link href="#" target="_blank">{"plus d'informations dans l'aide"}</Link>{"). Les avis et synthèses d'avis contiennent un paragraphe sur la place du médicament dans la stratégie thérapeutique."}
          <br/>
          <Table
            headers={[
              "Valeur du SMR",
              "Avis",
              "Motif de l'évaluation",
              "Résumé de l'avis"
            ]}
            data={[
              [
                "Important", 
                "Avis du 01/04",
                "Renouvellement d'inscription (CT)",
                "Le service médical rendu par les spécialités DOLIPRANE, GELUPRANE et PARACETAMOL ZENTIVA reste important dans les indications de l'AMM."
              ],
            ]}
          />
        </div>
      </ContentContainer>
      
      <ContentContainer id="document-has-asmr" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Amélioration du service médical rendu (ASMR)</h2>
        <div className={fr.cx("fr-text--sm", "fr-mb-0")}>
          {"Ce médicament étant un générique, l'ASMR n'a pas été évalué par la commission de la transparence (CT), il est possible de se référer à la /aux spécialité(s) de référence du groupe générique auquel appartient ce médicament ("}<Link href="#" target="_blank">cliquez ici pour aller à la rubrique des groupes génériques</Link>{")"}
        </div>
      </ContentContainer>
    </>
  );
};

export default DocumentHas;
