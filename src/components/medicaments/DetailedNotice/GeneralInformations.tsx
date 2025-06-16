"use client";

import ContentContainer from "../../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { HTMLAttributes, PropsWithChildren } from "react";
import styled from 'styled-components';
import GenericTag from "@/components/tags/GenericTag";
import { Presentation, PresInfoTarif, SpecComposant, SpecDelivrance, SubstanceNom } from "@/db/pdbmMySQL/types";
import PrescriptionTag from "@/components/tags/PrescriptionTag";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import PediatricsTags from "@/components/tags/PediatricsTags";
import Link from "next/link";
import PregnancyTag from "@/components/tags/PregnancyTag";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { displayCompleteComposants } from "@/displayUtils";
import PrincepsTag from "@/components/tags/PrincepsTag";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";

const SummaryLineContainer = styled.div `
  display: flex;
  font-size: 14px;
  align-items: center;
`;

const SummaryCat = styled.span `
  color: var(--text-title-blue-france);
  font-weight: bold;
  text-transform: uppercase;
`;

const InfosImportantes = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 1.5rem 1rem;

  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

interface SummaryLineProps extends HTMLAttributes<HTMLDivElement> {
  categoryName: string;
}

function SummaryLine(
  {categoryName, children, ...props} :PropsWithChildren<SummaryLineProps>
){
  return (
    <SummaryLineContainer className={fr.cx("fr-mb-1w", "fr-mt-1w")}>
      <ContentContainer className={fr.cx("fr-col-3")}>
        <SummaryCat>{categoryName}</SummaryCat>
      </ContentContainer>
      <ContentContainer className={fr.cx("fr-col-9")}>
        {children}
      </ContentContainer>
    </SummaryLineContainer>
  );
}

interface GeneralInformationsProps extends HTMLAttributes<HTMLDivElement> {
  updateVisiblePart: (visiblePart: DetailsNoticePartsEnum) => void;
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

function GeneralInformations({ 
  updateVisiblePart,
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
    <>
      <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Résumé</h2>
        <SummaryLineContainer>
          <ContentContainer className={fr.cx("fr-col-3")}>
            <SummaryCat className={fr.cx("fr-mr-1w")}>CIS</SummaryCat>
            {formatCIS(CIS)}
          </ContentContainer>
          <ContentContainer className={fr.cx("fr-col-9")}>
            <SummaryCat className={fr.cx("fr-mr-1w")}>ATC</SummaryCat>
            {atcCode} TODO
          </ContentContainer>
        </SummaryLineContainer>
        <SummaryLine categoryName="Substance Active">
          {displayCompleteComposants(composants)}
        </SummaryLine>
        <SummaryLine categoryName="Statut Générique">
          {isPrinceps && (
            <PrincepsTag CIS={CIS} />
          )}
          {!!SpecGeneId && (
            <>
              <GenericTag specGeneId={SpecGeneId} hideIcon/>
              <strong>Princeps: </strong>
            </>
          )}
        </SummaryLine>
        <SummaryLine categoryName="Conditions de prescription et de délivrance">
          {!!delivrance.length && (
            <ContentContainer>
              <PrescriptionTag hideIcon/>
              {delivrance.map((line: SpecDelivrance, index) => {
                return (
                  <Tag
                    key={index}
                    className={fr.cx("fr-ml-1w")}
                    nativeButtonProps={{
                      className: cx("fr-tag--custom-alt-blue"),
                    }}
                    style={{textTransform: "capitalize"}}
                  >
                    {line.DelivCourt}
                  </Tag>
                );
              })}
            </ContentContainer>
          )}
        </SummaryLine>
        <SummaryLine categoryName="Pédiatrie">
          {pediatrics && <PediatricsTags info={pediatrics} />}
          {/* <Link href="#">Voir dans le RCP</Link> */}
        </SummaryLine>
        <SummaryLine categoryName="Grossesse">
          {isPregnancyAlert && <PregnancyTag /> }
          <Link 
            href="#rcp-fertilite-grossesse-allaitement"
            onClick={() => updateVisiblePart(DetailsNoticePartsEnum.RCP)}
          >
            Voir dans le RCP
          </Link>
        </SummaryLine>
        <SummaryLine categoryName="Statut de l’autorisation">Valide</SummaryLine>
        <SummaryLine categoryName="Titulaire de l’autorisation">
          TODO
        </SummaryLine>
        <SummaryLine categoryName="Date de l’autorisation">
          TODO
        </SummaryLine>
        <SummaryLine categoryName="Statut de commercialisation">
          TODO
        </SummaryLine>
        <SummaryLine categoryName="Type de procédure">
          TODO
        </SummaryLine>
      </ContentContainer>
      <ContentContainer id="informations-importantes" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Informations importantes</h2>
        <InfosImportantes>
          <Link href="#" target="_blank" className={fr.cx("fr-text--sm")}>
            Amoxicilline : des recommandations pour contribuer à garantir la couverture des besoins des patients
          </Link>
          <div className={fr.cx("fr-mt-1w")}>
            <i className={fr.cx("fr-text--xs", "fr-mb-0")}>Octobre 2016</i>
            <Badge className={fr.cx("fr-badge--purple-glycine")} small>Recommandation ANSM</Badge>
          </div>
        </InfosImportantes>
      </ContentContainer>

      <ContentContainer id="informations-indications" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Indications</h2>
        <div className={fr.cx("fr-text--sm", "fr-mb-0")}>
          Classe pharmacothérapeutique – code ATC : N02BE01
          <br/><br/>
          DOLIPRANE 1000 mg, comprimé contient du paracétamol. Le paracétamol est un antalgique (calme la douleur) et un antipyrétique (fait baisser la fièvre).
          <br/><br/>
          Ce médicament est indiqué chez l’adulte et l’enfant à partir de 50 kg (environ 15 ans) pour faire baisser la fièvre et/ou soulager les douleurs légères à modérées (par exemple : maux de tête, états grippaux, douleurs dentaires, courbatures, règles douloureuses, poussées douloureuses de l’arthrose).
          <br/><br/>
          Lire attentivement le paragraphe « Posologie » de la rubrique 3.
          <br/><br/>
          Pour les enfants de moins de 50 kg, il existe d’autres présentations de paracétamol : demandez conseil à votre médecin ou à votre pharmacien.
        </div>
      </ContentContainer>
      
      <ContentContainer id="informations-composition" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Composition</h2>
        <div className={fr.cx("fr-text--sm", "fr-mb-0")}>
          1 comprimé<br/>
          {">"} paracétamol 1000 mg
        </div>
      </ContentContainer>
      
      <ContentContainer id="informations-presentations" whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Présentations</h2>
        <div>
          {/* <ul className={fr.cx("fr-raw-list")}>
            {presentations.map((p) => (
              <li key={p.Cip13} className={fr.cx("fr-mb-1w")}>
                <span
                  className={["fr-icon--custom-box", fr.cx("fr-mr-1w")].join(" ")}
                />
                <b>
                  {(p.details && presentationDetailName(p.details)) || p.PresNom01}
                </b>
                {p.PPF && p.TauxPriseEnCharge ? (
                  <div>
                    Prix{" "}
                    {Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(p.PPF)}{" "}
                    - remboursé à {p.TauxPriseEnCharge}
                  </div>
                ) : (
                  <div>Prix libre - non remboursable</div>
                )}
                {Number(p.CommId) !== PresentationComm.Commercialisation && (
                  <Badge severity="warning" className={fr.cx("fr-ml-1v")}>
                    {PresentationComm[p.CommId]}
                    {p.PresCommDate && ` (${dateShortFormat(p.PresCommDate)})`}
                  </Badge>
                )}
                {p.StatId && Number(p.StatId) === PresentationStat.Abrogation && (
                  <Badge severity="error" className={fr.cx("fr-ml-1v")}>
                    {PresentationStat[p.StatId]}
                    {p.PresStatDate && ` (${dateShortFormat(p.PresStatDate)})`}
                  </Badge>
                )}
              </li>
            ))}
          </ul> */}
        </div>
      </ContentContainer>
    </>
  );
};

export default GeneralInformations;
