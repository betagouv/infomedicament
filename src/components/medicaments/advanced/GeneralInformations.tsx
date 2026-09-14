"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren } from "react";
import styled, {css} from 'styled-components';
import GenericPrincepsTag from "@/components/tags/GenericPrincepsTag";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import PrescriptionTag from "@/components/tags/PrescriptionTag";
import PediatricsTags from "@/components/tags/PediatricsTags";
import Link from "next/link";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { dateShortFormat, displayCompleteComposants, displaySimpleComposants } from "@/displayUtils";
import MarrNoticeAdvanced from "@/components/marr/MarrNoticeAdvanced";
import { Marr } from "@/types/MarrTypes";
import { DelivranceCondition, DetailedSpecialite, SpecialiteStat } from "@/types/SpecialiteTypes";
import { displayInfosImportantes } from "@/utils/notices";
import PregnancyMentionTag from "@/components/tags/PregnancyMentionTag";
import PregnancyPlanTag from "@/components/tags/PregnancyPlanTag";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { Presentation } from "@/types/PresentationTypes";
import { getProcedureLibLong, getTypeInfoTxt, isAIP, isHospitalDelivrance } from "@/utils/specialites";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { getPresentationName, getPresentationFullPriceText, getPresentationCommercialStatusLabel, isAbrogee, isAgree, isIVG, isListeRetrocession, isListeSus, isReimbursable } from "@/utils/presentations";
import { FicheInfos, InfosImportantes } from "@/types/FicheInfoTypes";
import WithDefinition from "@/components/glossary/WithDefinition";
import { Definition } from "@/types/GlossaireTypes";
import { ShortIndication } from "@/types/IndicationsTypes";
import { getDefinition } from "@/utils/glossary";
import IndicationsBlock from "../blocks/IndicationsBlock";
import HospitalTag from "@/components/tags/HospitalTag";
import ReimbursableTag from "@/components/tags/ReimbursableTag";
import StockTag from "@/components/tags/StockTag";
import { AnsmStock } from "@/types/StockTypes";

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

const StockBlock = styled.div<{ $hideBorder?: boolean; }>`
  ${props => !props.$hideBorder && css`
    border-bottom: var(--border-open-blue-france) 4px solid;
  `}
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
  composants: CompositionComponent[];
  isPrinceps: boolean;
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;  
  presentations: Presentation[];
  marr?: Marr;
  ficheInfos?: FicheInfos;
  delivrance: DelivranceCondition[];
  definitions?: Definition[];
  indications: ShortIndication[];
  indicationsBlock?: string;
  stocks: AnsmStock[];
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
  delivrance,
  definitions,
  indications,
  indicationsBlock,
  stocks,
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
        <ContentContainer id="informations-importantes" whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
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
      <ContentContainer id="informations-resume" whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
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
            {(isPrinceps && specialite.genericGroupCode !== null && !isAIP(specialite)) ? (
              <GenericPrincepsTag 
                genericGroupCode={specialite.genericGroupCode}
                type="princeps"
                hideIcon
              />
            ) : (
              (specialite.genericGroupCode !== null && !isAIP(specialite))
              ? (
                <>
                  <GenericPrincepsTag 
                    genericGroupCode={specialite.genericGroupCode}
                    type="generic"
                    hideIcon
                  />
                  {specialite.referenceSpecialite && (
                    <div>
                      <strong>Princeps:&nbsp;</strong>{specialite.referenceSpecialite.name}
                    </div>
                  )}
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
            <span>Pas de contre-indication grossesse stricte, vérifier en 4.3 et 4.6 du RCP</span>
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
            ? (<span>{getProcedureLibLong(specialite.ProcId)}</span>)
            : (<span>Non communiqué</span>)
          }
        </SummaryLine>
        <SummaryLine categoryName="Conditions de prescription et de délivrance" hideBorder>
          {(delivrance && delivrance.length > 0) ? (
            <ContentContainer>
              <PrescriptionTag hideIcon/>
              {isReimbursable(presentations) && (
                <ReimbursableTag hideIcon className={fr.cx("fr-ml-1-5v")}/>
              )}
              {isHospitalDelivrance(delivrance) && (
                <HospitalTag hideIcon className={fr.cx("fr-ml-1-5v")}/>
              )}
              <ul>
                {delivrance.map((line: DelivranceCondition, index) => {
                  const label = line.longLabel?.trim();
                  if (!label) return null;
                  return (
                    <li key={line.code || index}>
                      {(label === "liste I" || label === "liste II")
                        ? (
                          <WithDefinition
                            definition={definitions && getDefinition(definitions, "Liste I et II")}
                            word={label}
                          />
                        )
                        : label}
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

      <IndicationsBlock
        specialite={specialite}
        indications={indications}
        indicationsBlock={indicationsBlock}
        definitions={definitions}
      />
      
      <ContentContainer id="informations-composition" whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
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
                  {element.composants.length === 0 && (
                    <div className={fr.cx("fr-ml-1w", "fr-mb-1w")}>
                      {" > "}Pas de substance active
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <span>La composition n'est pas communiquée</span>
        )}
      </ContentContainer>
      
      <ContentContainer id="informations-presentations" whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Présentations</h2>
        {(presentations && presentations.length > 0) ? (
          <div>
            <ul className={fr.cx("fr-raw-list")}>
              {presentations.map((pres, index) => (
                <li key={`${pres.cip13}-${index}`} className={fr.cx("fr-mb-1w")}>
                  <div className={fr.cx("fr-mb-0")}>
                    <span
                      className={["fr-icon--custom-box", fr.cx("fr-mr-1w")].join(" ")}
                    />
                    <span className={fr.cx("fr-mr-2w")}>
                      <b>{getPresentationName(pres)}</b>
                    </span>
                    {pres.pricingKnown && <span>{getPresentationFullPriceText(pres)}</span>}
                  </div>
                  {(pres.priceExcludingDispensingFee || pres.dispensingFee) && (
                    <div className={fr.cx("fr-mb-0")}>
                      {pres.priceExcludingDispensingFee && (
                        <span className={fr.cx("fr-mr-2w")}>
                          Prix hors honoraire de dispensation :{" "}
                          {Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(pres.priceExcludingDispensingFee)}
                          {" "}
                        </span>
                      )}
                      {pres.dispensingFee && (
                        <span>
                          <WithDefinition
                            definition={definitions && getDefinition(definitions, "Honoraire de dispensation")}
                            word="Honoraire de dispensation"
                          />{" : "}
                          {Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(pres.dispensingFee)}
                          {" "}
                        </span>
                      )}
                    </div>
                  )}
                  {(pres.commercialisationDate || pres.cip7) && (
                    <div className={fr.cx("fr-mb-0")}>
                      {pres.cip7 && (
                        <span className={fr.cx("fr-mr-2w")}>Code CIP : {pres.cip7}</span>
                      )}
                      {pres.commercialisationDate && (
                        <span>Déclaration de commercialisation : {dateShortFormat(pres.commercialisationDate)}</span>
                      )}
                    </div>
                  )}
                  {isAbrogee(pres) && (
                    <div className={fr.cx("fr-mb-0")}>
                      Abrogée
                    </div>
                  )}
                  {getPresentationCommercialStatusLabel(pres) && (
                    <div className={fr.cx("fr-mb-0")}>
                      {getPresentationCommercialStatusLabel(pres)}
                      {pres.commercialisationEndDate && ` : ${dateShortFormat(pres.commercialisationEndDate)}`}
                    </div>
                  )}
                  {isAgree(pres) ? (
                    <div className={fr.cx("fr-mb-0")}>
                      Cette présentation est{" "}
                      <WithDefinition
                        definition={definitions && getDefinition(definitions,"Agrément aux collectivités")}
                        word="agréée aux collectivités"
                      />.
                    </div>
                  ) : pres.communityApproval === false ? (
                    <div className={fr.cx("fr-mb-0")}>
                      Cette présentation n'est pas agréée aux collectivités.
                    </div>
                  ) : null}
                  {isListeSus(pres) && (
                    <div>
                      Inscription sur la{" "}
                      <WithDefinition
                        definition={definitions && getDefinition(definitions, "Liste en sus")}
                        word="liste en sus"
                      />, pour au moins l'une de ses indications.{" "}
                      <WithDefinition
                        definition={definitions && getDefinition(definitions, "Tarif de responsabilité")}
                        word="Tarif de responsabilité"
                      />{" "}publié au Journal Officiel.</div>
                  )}
                  {isListeRetrocession(pres) && (
                    <div>
                      Inscription sur la{" "}
                      <WithDefinition
                        definition={definitions && getDefinition(definitions, "Liste de rétrocession")}
                        word="liste de rétrocession"
                      />{" "}
                      au titre de son AMM, selon les conditions précisées au Journal Officiel.{" "}
                      <WithDefinition
                        definition={definitions && getDefinition(definitions, "Prix de cession")}
                        word="Prix de cession"
                      />{" "}publié au Journal Officiel.</div>
                  )}
                  {isIVG(pres) && (
                    <div>
                      Tarification particulière en ville : médicament vendu en officine uniquement aux médecins ou sages-femmes - prix fixé par{" "}
                      <Link 
                        href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000032164949"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        arrêté du 26 juillet 2016
                      </Link>{" "}relatif aux forfaits afférents à l'interruption volontaire de grossesse.
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
        <ContentContainer id="informations-marr" whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
          <MarrNoticeAdvanced marr={marr} />
        </ContentContainer>
      )}

      {stocks.length > 0 && (
        <ContentContainer id="informations-stock" whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
          <h2 className={fr.cx("fr-h6")}>Ruptures de stock ou risques de rupture de stock</h2>
          {stocks.map((stock, index) => (
            <StockBlock key={index} $hideBorder={index === stocks.length - 1}>
              <SummaryLine categoryName="Code CIS concerné">
                {formatCIS(specialite.SpecId)}
              </SummaryLine>
              {stock.CIP && stock.CIP.length > 0 && (
                <SummaryLine categoryName={stock.CIP.length > 1 ? 'Codes CIP concernés' : 'Code CIP concerné'}>
                  {stock.CIP.join(", ")}
                </SummaryLine>
              )}
              <SummaryLine categoryName="Statut">
                <StockTag
                  statusId={stock.status_id}
                />
              </SummaryLine>
              <SummaryLine categoryName="Date de début">
                {(stock.date_begin).toLocaleDateString('fr-FR')}
              </SummaryLine>
              <SummaryLine categoryName="Date de mise à jour">
                {(stock.date_update).toLocaleDateString('fr-FR')}
              </SummaryLine>
              {stock.date_end && (
                <SummaryLine categoryName="Date de remise à disposition">
                  {(stock.date_end).toLocaleDateString('fr-FR')}
                </SummaryLine>
              )}
              <SummaryLine 
                categoryName="Lien vers la page du site de l'ANSM"
                hideBorder
              >
                <a href={stock.link} target="_blank">{stock.link}</a>
              </SummaryLine>
            </StockBlock>
          ))}
        </ContentContainer>
      )}
    </div>
    )
  );
};

export default GeneralInformations;
