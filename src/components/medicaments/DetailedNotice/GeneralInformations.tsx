"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren } from "react";
import styled, {css} from 'styled-components';
import GenericTag from "@/components/tags/GenericTag";
import { Presentation, PresInfoTarif, SpecComposant, SubstanceNom } from "@/db/pdbmMySQL/types";
import PrescriptionTag from "@/components/tags/PrescriptionTag";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import PediatricsTags from "@/components/tags/PediatricsTags";
import Link from "next/link";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { dateShortFormat, displayCompleteComposants, displaySimpleComposants } from "@/displayUtils";
import PrincepsTag from "@/components/tags/PrincepsTag";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";
import MarrNoticeAdvanced from "@/components/marr/MarrNoticeAdvanced";
import { Marr } from "@/types/MarrTypes";
import { FicheInfos, NoticeRCPContentBlock } from "@/types/MedicamentTypes";
import { displayInfosImportantes, getContent } from "@/utils/notices/noticesUtils";
import PregnancyMentionTag from "@/components/tags/PregnancyMentionTag";
import PregnancyPlanTag from "@/components/tags/PregnancyPlanTag";

const SummaryLineContainer = styled.div<{ $hideBorder?: boolean; }>`
  display: flex;
  align-items: center;
  ${props => !props.$hideBorder && css`
    border-bottom: var(--border-open-blue-france) 1px solid;
  `}
`;

const SummaryCat = styled.span `
  color: var(--text-mention-grey);
`;

const InfosImportantes = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;

  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  a {
    background: none;
    text-decoration: underline;
  }
`;

const IndicationBlock = styled.div`
  div {
    margin-bottom: 1rem;
  }
`;

interface SummaryLineProps extends HTMLAttributes<HTMLDivElement> {
  categoryName: string;
  hideBorder?: boolean;
}

function SummaryLine({
  categoryName,
  hideBorder,
  children,
  ...props
} :PropsWithChildren<SummaryLineProps>){
  return (
    <SummaryLineContainer className={fr.cx("fr-mb-1w", "fr-pb-1w", "fr-mt-1w", "fr-text--sm")} $hideBorder={hideBorder}>
      <ContentContainer className={fr.cx("fr-col-4", "fr-col-sm-3")}>
        <SummaryCat>{categoryName}</SummaryCat>
      </ContentContainer>
      <ContentContainer className={fr.cx("fr-col-8", "fr-col-sm-9")}>
        {children}
      </ContentContainer>
    </SummaryLineContainer>
  );
}

interface GeneralInformationsProps extends HTMLAttributes<HTMLDivElement> {
  updateVisiblePart: (visiblePart: DetailsNoticePartsEnum) => void;
  CIS: string;
  atcCode?: string;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  SpecGeneId?: string;
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;  
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
  marr?: Marr;
  ficheInfos?: FicheInfos;
  indicationBlock?: NoticeRCPContentBlock;
}

function GeneralInformations({ 
  updateVisiblePart,
  CIS,
  atcCode,
  composants,
  isPrinceps,
  SpecGeneId,
  isPregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  ficheInfos,
  indicationBlock,
  ...props 
}: GeneralInformationsProps) {
  
  function formatCIS(CIS: string): string {
    const cutting = [1, 3, 3, 1];
    let next = CIS.length - cutting[0];
    let finalCIS = CIS.substring(next);
    for(let i = 1; i < cutting.length; i++){
      let newNext = next - cutting[i];
      if(next !== 0 && next !== newNext){
        if(newNext < 0) newNext = 0;
        finalCIS = CIS.substring(newNext, next) + " " + finalCIS;
        next = newNext;
      }
    }
    return finalCIS;
  }

  return (
    ficheInfos && (
    <>
      {ficheInfos.listeInformationsImportantes && displayInfosImportantes(ficheInfos) && (
        <ContentContainer id="informations-importantes" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <h2 className={fr.cx("fr-h6")}>Informations importantes</h2>
          {ficheInfos.listeInformationsImportantes.map((info, index) => {
            return (
              <InfosImportantes key={index}>
                <div dangerouslySetInnerHTML={{__html: info}} className={fr.cx("fr-text--sm", "fr-mb-0")}></div>
              </InfosImportantes>
            )
          })}
        </ContentContainer>
      )}
      <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Résumé</h2>
        <SummaryLine categoryName="Code CIS">
          {formatCIS(CIS)}
        </SummaryLine>
        {atcCode && (
          <SummaryLine categoryName="Classe ATC">
            {atcCode}{" "}
            <span style={{textTransform:"capitalize"}}>
              {displaySimpleComposants(composants).map((s) => s.NomLib.trim()).join(", ")}
            </span>
          </SummaryLine>
        )}
        <SummaryLine categoryName="Substance active">
          {displayCompleteComposants(composants)}
        </SummaryLine>
        <SummaryLine categoryName="Statut générique">
          <>
            {isPrinceps ? (
              <PrincepsTag CIS={CIS} />
            ) : (
              SpecGeneId 
              ? (
                <>
                  <GenericTag specGeneId={SpecGeneId} hideIcon/>
                  {/* <strong>Princeps: </strong> */}
                </>
            
              ) : (
                <span>Pas de générique</span>
              )
            )}
          </>
        </SummaryLine>
        <SummaryLine categoryName="Pédiatrie">
          {pediatrics ? (
            <PediatricsTags info={pediatrics} />
          ) : ( 
            <span>Aucune information pédiatrique disponible</span>
          )}
          {/* <Link href="#">Voir dans le RCP</Link> */}
        </SummaryLine>
        <SummaryLine categoryName="Grossesse">
          {(isPregnancyMentionAlert || isPregnancyPlanAlert) ? (
            <>
              {isPregnancyPlanAlert && (<PregnancyPlanTag />)}
              {(!isPregnancyPlanAlert && isPregnancyMentionAlert) && (<PregnancyMentionTag />)}
            </>
          ) : (
            <span>Aucune contre-indication grossesse</span>
          )}
          {/* <Link 
            href="#rcp-fertilite-grossesse-allaitement"
            onClick={() => updateVisiblePart(DetailsNoticePartsEnum.RCP)}
          >
            Voir dans le RCP
          </Link> */}
        </SummaryLine>
        <SummaryLine categoryName="Statut de l’autorisation">
          {ficheInfos.libelleCourtAutorisation}
        </SummaryLine>
        <SummaryLine categoryName="Titulaire de l’autorisation">
          {ficheInfos.listeTitulaires?.join(", ")}
        </SummaryLine>
        {/* <SummaryLine categoryName="Date de l’autorisation">
        </SummaryLine> */}
        {/* <SummaryLine categoryName="Statut de commercialisation">
          {ficheInfos.libelleCourtAutorisation}
        </SummaryLine> */}
        <SummaryLine categoryName="Type de procédure">
          {(ficheInfos.libelleCourtProcedure === "Enreg homéo (Proc. Nat.)" 
            || ficheInfos.libelleCourtProcedure === "Enreg phyto (Proc. Nat.)" || ficheInfos.libelleCourtProcedure === "Nationale") ? (
            <span>Procédure nationale</span>
          ) : ( 
            ficheInfos.libelleCourtProcedure === "Reconnaissance mutuelle" ? (
              <span>Procédure de reconnaissance mutuelle</span>
            ) : (
              ficheInfos.libelleCourtProcedure === "Centralisée" ? (
                <span>Procédure centralisée</span>
              ) : (
                (ficheInfos.libelleCourtProcedure === "Enreg phyto (Proc. Dec.)"
                  || ficheInfos.libelleCourtProcedure === "Décentralisée"
                ) ? (
                  <span>Procédure décentralisée</span>
                ) : (
                  <span>{ficheInfos.libelleCourtProcedure}</span>
                )
              )
            )
          ) }
        </SummaryLine>
        <SummaryLine categoryName="Conditions de prescription et de délivrance" hideBorder>
          {(ficheInfos.listeConditionsDelivrance && ficheInfos.listeConditionsDelivrance.length > 0) ? (
            <ContentContainer>
              <PrescriptionTag hideIcon/>
              <ul>
                {ficheInfos.listeConditionsDelivrance.map((line: string, index) => {
                  return (
                    <li key={index}>
                      {line}
                    </li>
                  );
                })}
              </ul>
            </ContentContainer>
          ) : (
            <span>Aucune</span>
          )}
        </SummaryLine>
      </ContentContainer>

      {(indicationBlock && indicationBlock.children) && (
        <ContentContainer id="informations-indications" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <h2 className={fr.cx("fr-h6")}>Indications</h2>
          <IndicationBlock className={fr.cx("fr-mb-0")}>
            {getContent(indicationBlock.children)}
          </IndicationBlock>
        </ContentContainer>
      )}
      
      {((ficheInfos.listeElements && ficheInfos.listeElements.length > 0) || (ficheInfos.listeComposants && ficheInfos.listeComposants.length > 0)) && (
        <ContentContainer id="informations-composition" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <h2 className={fr.cx("fr-h6")}>Composition</h2>
          {(ficheInfos.listeElements && ficheInfos.listeElements.length > 0) && (
            <div className={fr.cx("fr-mb-0")}>
              {ficheInfos.listeElements.map((element, index) => {
                return (
                  <span key={index}>
                    {index > 1 && ", "}
                    {element.referenceDosage.charAt(0).toUpperCase()}{element.referenceDosage.substring(1)}
                  </span>
                )
              })}
            </div>
          )}
          {(ficheInfos.listeComposants && ficheInfos.listeComposants.length > 0) && (
            <div className={fr.cx("fr-mb-0")}>
              {ficheInfos.listeComposants.map((composant, index) => {
                return (<span key={index}>{" > "}{composant.nom}{" "}{composant.dosage}</span>)
              })}
            </div>
          )}
        </ContentContainer>
      )}
      
      {(presentations && presentations.length > 0) && (
        <ContentContainer id="informations-presentations" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <h2 className={fr.cx("fr-h6")}>Présentations</h2>
          <div>
            <ul className={fr.cx("fr-raw-list")}>
              {presentations.map((pres, index) => (
                <li key={`${pres.Cip13}-${index}`} className={fr.cx("fr-mb-1w")}>
                  <div className={fr.cx("fr-mb-0")}>
                    <span
                      className={["fr-icon--custom-box", fr.cx("fr-mr-1w")].join(" ")}
                    />
                    {pres.details ? (
                      <span className={fr.cx("fr-mr-2w")}>
                        {pres.details.qtecontenance && (
                          <>
                            <b>
                              {pres.details.qtecontenance.toLocaleString('fr-FR')}{" "}
                              {pres.details.unitecontenance && (
                                <>
                                  {pres.details.qtecontenance > 1
                                    ? pres.details.unitecontenance.replaceAll("(s)", "s")
                                    : pres.details.unitecontenance.replaceAll("(s)", "")
                                  }
                                </>
                              )}
                            </b>
                            {" - "}
                          </>
                        )}
                        {pres.details.recipient.replaceAll("thermoformée", "").replaceAll("(s)", "")}
                      </span>
                    ) : (
                      <b>{pres.PresNom01}</b>
                    )}
                    {pres.PPF && pres.TauxPriseEnCharge ? (
                      <span>
                        Prix{" "}
                        {Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(pres.PPF)}{" "}
                        - remboursé à {pres.TauxPriseEnCharge}
                      </span>
                    ) : (
                      <span>Prix libre - non remboursable</span>
                    )}
                  </div>
                  {(pres.Ppttc || pres.HonoDisp) && (
                    <div className={fr.cx("fr-mb-0")}>
                      {pres.Ppttc && (
                        <span className={fr.cx("fr-mr-2w")}>
                          Prix hors honoraire de dispensation :{" "}
                          {Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(pres.Ppttc)}
                          {" "}
                        </span>
                      )}
                      {pres.HonoDisp && (
                        <span>
                          <u>Honoraire de dispensation</u> : {" "}
                          {Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(pres.HonoDisp)}
                          {" "}
                        </span>
                      )}
                    </div>
                  )}
                  {(pres.PresCommDate && pres.PresCodeCip) && (
                    <div className={fr.cx("fr-mb-0")}>
                      {pres.PresCodeCip && (
                        <span className={fr.cx("fr-mr-2w")}>Code CIP : {pres.PresCodeCip}</span>
                      )}
                      {pres.PresCommDate && (
                        <span>Déclaration de commercialisation : {dateShortFormat(pres.PresCommDate)}</span>
                      )}
                    </div>
                  )}
                  <div className={fr.cx("fr-mb-0")}>
                    Cette présentation est{" "}
                    <Link href="https://base-donnees-publique.medicaments.gouv.fr/glossaire.php#agrecol" target="_blank" rel="noopener noreferrer">
                      agréée aux collectivités
                    </Link>.
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ContentContainer>
      )}

      {(marr && marr.pdf.length > 0) && (
        <ContentContainer id="informations-marr" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <MarrNoticeAdvanced marr={marr} />
        </ContentContainer>
      )}
    </>
    )
  );
};

export default GeneralInformations;
