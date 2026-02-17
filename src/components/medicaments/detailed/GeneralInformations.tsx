"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren, useEffect, useState } from "react";
import styled, {css} from 'styled-components';
import GenericTag from "@/components/tags/GenericTag";
import { PresentationStat, SpecComposant, SpecDelivrance, SpecialiteStat, SubstanceNom } from "@/db/pdbmMySQL/types";
import PrescriptionTag from "@/components/tags/PrescriptionTag";
import PediatricsTags from "@/components/tags/PediatricsTags";
import Link from "next/link";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { dateShortFormat, displayCompleteComposants, displaySimpleComposants } from "@/displayUtils";
import PrincepsTag from "@/components/tags/PrincepsTag";
import MarrNoticeAdvanced from "@/components/marr/MarrNoticeAdvanced";
import { Marr } from "@/types/MarrTypes";
import { DetailedSpecialite, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { displayInfosImportantes, getContent } from "@/utils/notices/noticesUtils";
import PregnancyMentionTag from "@/components/tags/PregnancyMentionTag";
import PregnancyPlanTag from "@/components/tags/PregnancyPlanTag";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getProcedureLibLong, getTypeInfoTxt, isAIP, isCentralisee } from "@/utils/specialites";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { FicheInfos, InfosImportantes } from "@/types/FicheInfoTypes";

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

const InfosImportantesBlock = styled.div`
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
  children
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
  specialite?: DetailedSpecialite;
  atcCode?: string;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;  
  presentations: Presentation[];
  marr?: Marr;
  ficheInfos?: FicheInfos;
  indicationBlock?: NoticeRCPContentBlock;
  delivrance: SpecDelivrance[];
}

function GeneralInformations({ 
  updateVisiblePart,
  specialite,
  atcCode,
  composants,
  isPrinceps,
  isPregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  ficheInfos,
  indicationBlock,
  delivrance,
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
    (ficheInfos && specialite) && (
    <div {...props}>
      {ficheInfos.listeInformationsImportantes && displayInfosImportantes(ficheInfos) && (
        <ContentContainer id="informations-importantes" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <h2 className={fr.cx("fr-h6")}>Informations importantes</h2>
          {ficheInfos.listeInformationsImportantes.map((info: InfosImportantes, index) => {
            return (
              <InfosImportantesBlock key={index}>
                <div dangerouslySetInnerHTML={{__html: info.remCommentaire}} className={fr.cx("fr-text--sm", "fr-mb-0")}></div>
                {(info.dateEvnt || info.codeTypeInfo) && (
                  <div className={fr.cx("fr-mt-1w")}>
                    {info.dateEvnt && (
                      <i className={fr.cx("fr-text--xs", "fr-mb-0")} style={{textTransform:"capitalize"}}>
                        {info.dateEvnt.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'})}
                      </i>
                    )}
                    {info.codeTypeInfo && (
                      <Badge className={fr.cx("fr-badge--purple-glycine")} small>{getTypeInfoTxt(info.codeTypeInfo)}</Badge>
                    )}
                  </div>
                )}
              </InfosImportantesBlock>
            )
          })}
        </ContentContainer>
      )}    
      <ContentContainer id="informations-resume" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Résumé</h2>
        <SummaryLine categoryName="Code CIS">
          {formatCIS(specialite.SpecId)}
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
            {(isPrinceps && !isAIP(specialite)) ? (
              <PrincepsTag 
                CIS={specialite.SpecId} 
                hideIcon
              />
            ) : (
              (specialite.SpecGeneId && !isAIP(specialite))
              ? (
                <>
                  <GenericTag 
                    specGeneId={specialite.SpecGeneId} 
                    hideIcon
                  />
                  <div>
                    <strong>Princeps:&nbsp;</strong>{specialite.generiqueName}
                  </div>
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
        </SummaryLine>
        <SummaryLine categoryName="Statut de l’autorisation">
          {specialite.statutAutorisation 
            ? (
              <>
                <span>{specialite.statutAutorisation}</span>
                {(specialite.StatId && Number(specialite.StatId) === SpecialiteStat.Abrogée && specialite.SpecStatDate) && (
                  <span className={fr.cx("fr-text--sm")}>{" "}le {(specialite.SpecStatDate).toLocaleDateString('fr-FR')}</span>
                )}
              </>
            )
            : (<span>Non communiqué</span>)
          }
        </SummaryLine>
        <SummaryLine categoryName="Date d'autorisation de mise sur le marché">
          {specialite.SpecDateAMM 
            ? (<span>Le&nbsp;{(specialite.SpecDateAMM).toLocaleDateString('fr-FR')}</span>)
            : (<span>Non communiquée</span>)
          }
        </SummaryLine>
        <SummaryLine categoryName="Titulaire de l’autorisation">
          {specialite.titulairesList 
            ? (<span>{specialite.titulairesList}</span>)
            : (<span>Non communiqué</span>)
          }
        </SummaryLine>
        <SummaryLine categoryName="Statut de commercialisation">
          {specialite.statutComm 
            ? (<span>{specialite.statutComm}</span>)
            : (<span>Non communiqué</span>)
          }
        </SummaryLine>
        <SummaryLine categoryName="Type de procédure">
          {specialite.ProcId 
            ? (<span>{getProcedureLibLong(Number(specialite.ProcId))}</span>)
            : (<span>Non communiqué</span>)
          }
        </SummaryLine>
        <SummaryLine categoryName="Conditions de prescription et de délivrance" hideBorder>
          {(delivrance && delivrance.length > 0) ? (
            <ContentContainer>
              <PrescriptionTag hideIcon/>
              <ul>
                {delivrance.map((line: SpecDelivrance, index) => {
                  return (
                    <li key={index}>
                      {line.DelivLong}
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

      <ContentContainer id="informations-indications" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Indications</h2>
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
                <span>{getContent(indicationBlock.children)}</span>
              ) : (
                <span>Les indications thérapeutiques ne sont pas disponibles.</span>
              )
            )
          )}
        </IndicationBlock>
      </ContentContainer>
      
      <ContentContainer id="informations-composition" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Composition</h2>
        {(ficheInfos.listeElements && ficheInfos.listeElements.length > 0) 
        ? (
          <div className={fr.cx("fr-mb-0")}>
            {ficheInfos.listeElements.map((element, index) => {
              return (
                <div 
                  key={index}
                  className={fr.cx("fr-mb-2w")}
                >
                  <div className={fr.cx("fr-mb-1w")}>
                    {element.referenceDosage.charAt(0).toUpperCase()}{element.referenceDosage.substring(1)}
                  </div>
                  {element.composants.map((composant, indexComp) => {
                    return (
                      <div 
                        key={indexComp} 
                        className={fr.cx("fr-ml-1w", "fr-mb-1w")}
                      >
                        {" > "}{composant.NomLib}{" "}{composant.dosage}
                        {composant.composants && composant.composants.length > 0 && (
                          <div>
                            {composant.composants.map((subComposant, indexSubComposant) => {
                              return (
                                <div 
                                  key={indexSubComposant} 
                                  className={fr.cx("fr-ml-3w")}
                                >
                                  sous forme de : {subComposant.NomLib}{" "}{subComposant.dosage}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ) : (
          <span>La composition n'est pas communiquée</span>
        )}
      </ContentContainer>
      
      <ContentContainer id="informations-presentations" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Présentations</h2>
        {(presentations && presentations.length > 0) ? (
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
                        <b>
                          {pres.details.qtecontenance ? (
                            <>
                              {pres.details.qtecontenance.toLocaleString('fr-FR')}{" "}
                              {pres.details.unitecontenance && (
                                <span>
                                  {pres.details.qtecontenance > 1 
                                    ? pres.details.unitecontenance.replaceAll("(s)", "s")
                                    : pres.details.unitecontenance.replaceAll("(s)", "")
                                  }
                                </span>
                              )}
                            </>
                          ) : (
                            <span>{"1"}</span>
                          )}
                        </b>{" - "}
                        {pres.details.recipient && (
                          <span>
                            {pres.details.recipient.replaceAll("thermoformée", "").replaceAll("(s)", "")}
                          </span>
                        )}
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
                  {pres.StatId && Number(pres.StatId) === PresentationStat.Abrogation && (
                    <div className={fr.cx("fr-mb-0")}>
                      Abrogée
                      {pres.PresStatDAte && ` le ${dateShortFormat(pres.PresStatDAte)}`}
                    </div>
                  )}
                  {(pres.AgreColl && pres.AgreColl === 1) ? (
                    <div className={fr.cx("fr-mb-0")}>
                      Cette présentation est{" "}
                      <Link href="https://base-donnees-publique.medicaments.gouv.fr/glossaire.php#agrecol" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        agréée aux collectivités
                      </Link>.
                    </div>
                  ) : (
                    <div className={fr.cx("fr-mb-0")}>
                      Cette présentation n'est pas {" "}
                      <Link href="https://base-donnees-publique.medicaments.gouv.fr/glossaire.php#agrecol" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        agréée aux collectivités
                      </Link>.
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span>Pas de conditionnement à afficher</span>
        )}
      </ContentContainer>


      {(marr && marr.pdf.length > 0) && (
        <ContentContainer id="informations-marr" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
          <MarrNoticeAdvanced marr={marr} />
        </ContentContainer>
      )}
    </div>
    )
  );
};

export default GeneralInformations;
