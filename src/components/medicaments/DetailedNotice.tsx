"use client";

import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import styled, { css } from 'styled-components';
import GeneralInformations from "./DetailedNotice/GeneralInformations";
import { Presentation, PresInfoTarif, SpecComposant, SpecDelivrance, SubstanceNom } from "@/db/pdbmMySQL/types";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";
import DocumentHas from "./DetailedNotice/DocumentHas";

const DetailedNoticeContainer = styled.div<{ $visible: boolean; }> `
  ${props => !props.$visible && css`
    display: none;
  `}
`;

interface DetailedNotice extends HTMLAttributes<HTMLDivElement> {
  currentVisiblePart: DetailsNoticePartsEnum;
  CIS: string;
  atcCode: string;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  SpecGeneId: string;
  delivrance: SpecDelivrance[];
  isPregnancyAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
}

function DetailedNotice({
  currentVisiblePart, 
  CIS,
  atcCode,
  composants,
  isPrinceps,
  SpecGeneId,
  delivrance,
  isPregnancyAlert,
  pediatrics,
  presentations,
  ...props 
}: DetailedNotice) {

  const [visiblePart, setVisiblePart] = useState<DetailsNoticePartsEnum>(currentVisiblePart);

  useEffect(() => {
    setVisiblePart(currentVisiblePart);
  }, [currentVisiblePart])

  return (
    <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")}>
      <DetailedNoticeContainer id="informations-generales" $visible={visiblePart === DetailsNoticePartsEnum.INFORMATIONS_GENERALES}>
        <GeneralInformations 
          CIS={CIS}
          atcCode={atcCode}
          composants={composants}
          isPrinceps={isPrinceps}
          SpecGeneId={SpecGeneId}
          delivrance={delivrance}
          isPregnancyAlert={isPregnancyAlert}
          pediatrics={pediatrics}
          presentations={presentations}
          updateVisiblePart={setVisiblePart}
        />
      </DetailedNoticeContainer>
      <DetailedNoticeContainer id="rcp-denomiation" $visible={visiblePart === DetailsNoticePartsEnum.RCP}>
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          Résumé des caractéristiques du produit (RCP)
          <div>
            1. Dénomination
          </div>
          <div id="rcp-composition">
            2. Composition
          </div>
          <div id="rcp-forme-pharmaceutique">
            3. Forme pharmaceutique
          </div>
          <div id="rcp-indications-therapeutiques">
            4. Données cliniques
            <div>
              4.1. Indications thérapeutiques
            </div>
            <div id="rcp-posologie-mode-administration">
              4.2. Posologie et mode d’administration
            </div>
            <div id="rcp-contre-indications">
              4.3. Contre-indications
            </div>
            <div id="rcp-precautions-emploi">
              4.4. Mises en garde spéciales et précautions d’emploi
            </div>
            <div id="rcp-interactions">
              4.5. Interactions avec d’autres médicaments et autres formes d’interactions
            </div>
            <div id="rcp-fertilite-grossesse-allaitement">
              4.6. Fertilité, grossesse et allaitement
            </div>
            <div id="rcp-conduite">
              4.7. Effets sur l’aptitude à conduire des véhicules et à utiliser des machines
            </div>
            <div id="rcp-effets-indesirables">
              4.8. Effets indésirables
            </div>
            <div id="rcp-surdosage">
              4.9. Surdosage
            </div>
          </div>
          <div id="rcp-proprietes-pharmacodynamiques">
            5. Propriétés pharmacologiques
            <div>
              5.1. Propriétés pharmacodynamiques
            </div>
            <div id="rcp-proprietes-pharmacocinetiques">
              5.2. Propriétés pharmacocinétiques
            </div>
            <div id="rcp-donnees-securite-preclinique">
              5.3. Données de sécurité préclinique
            </div>
          </div>
          <div id="rcp-pharmacologie-liste-excipients">
            6. Données pharmacologiques
            <div>
              6.1. Liste des excipients
            </div>
            <div id="rcp-pharmacologie-incompatibilites">
              6.2. Incompatibilités
            </div>
            <div id="rcp-pharmacologie-duree-conservation">
              6.3. Durée de conservation
            </div>
            <div id="rcp-pharmacologie-precautions-conservation">
              6.4. Précautions particulières de conservation
            </div>
            <div id="rcp-pharmacologie-emballage-exterieur">
              6.5. Nature et contenu de l’emballage extérieur
            </div>
            <div id="rcp-pharmacologie-elimination-manipulation">
              6.6. Précautions particulières d’élimination et de manipulation
            </div>
          </div>
          <div id="rcp-titulaire-amm">
            7. Titulaire l’AMM
          </div>
          <div id="rcp-numeros-amm">
            8. Numéro(s) de l’AMM
          </div>
          <div id="rcp-date-autorisation">
            9. Date de première autorisation/de renouvellement de l’autorisation
          </div>
          <div id="rcp-date-mise-jour-texte">
            10. Date de mise à jour du texte
          </div>
          <div id="rcp-dosimetrie">
            11. Dosimétrie
          </div>
          <div id="rcp-preparation-radiopharmaceutiques">
            12. Instructions pour la préparation des radiopharmaceutiques
          </div>
        </ContentContainer>
      </DetailedNoticeContainer>
      <DetailedNoticeContainer id="document-has-bon-usage" $visible={visiblePart === DetailsNoticePartsEnum.HAS}>
        <DocumentHas />
      </DetailedNoticeContainer>
    </ContentContainer>
  );
};

export default DetailedNotice;
