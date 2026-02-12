"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import PediatricsTags from "../tags/PediatricsTags";
import PregnancyMentionTag from "@/components/tags/PregnancyMentionTag";
import PregnancyPlanTag from "@/components/tags/PregnancyPlanTag";
import { ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { isAIP, isAlerteSecurite, isCommercialisee } from "@/utils/specialites";

const GreyContainer = styled.div<{ $isDetailsVisible?: boolean; }>`
  ${props => props.$isDetailsVisible && props.$isDetailsVisible && css`
    border-bottom: var(--border-open-blue-france) 1px solid;
    background-color: var(--background-alt-grey);
    border-radius: 8px 8px 0 0;
  `}
`;

const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  ${GreyContainer}:hover{
    background-color: var(--background-alt-grey);
    border-radius: 8px;
    cursor: pointer;
  }
`;

const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RowToColumnContainer = styled.div`
  @media (max-width: 48em) {
    display: flex;
    flex-direction: column;
    .fr-text--sm, .fr-text--md {
      margin-bottom: 0px;
    }
  }
`;

const SpecName = styled.span`
  color: var(--grey-200-850);
  font-weight: bold;
`;
const SpecLength = styled.span`
  color: var(--text-default-info);
`;
const GreyText = styled.span`
  color: var(--text-mention-grey);
`;
const DarkGreyText = styled.span`
  color: var(--text-title-grey);
`;
const RedText = styled.span`
  color: var(--text-default-warning);
`;
const GreenText = styled.span`
  color: var(--text-default-success);
`;
const YellowText = styled.span`
  color: var(--yellow-tournesol-main-731);
`;
const FiltersTagContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  a{
    margin-right: 0.5rem;
    margin-top: 0.2rem;
  }
`;

interface DataBlockAccordionProps extends HTMLAttributes<HTMLDivElement> {
  item: ResumeSpecGroup;
  filterPregnancy?: boolean;
  filterPediatric?: boolean;
  withAlert?: boolean;
}

//For now only for type === DataTypeEnum.MEDICAMENT
function DataBlockAccordion({
  item,
  filterPregnancy,
  filterPediatric,
  withAlert
}: DataBlockAccordionProps) {

  const [specialitesGroup, setSpecialitesGroup] = useState< ResumeSpecGroup>();
  const [groupName, setGroupName] = useState<string>("");
  const [specialites, setSpecialites] = useState<ResumeSpecialite[]>();

  const [fullListeComposants, setFullListeComposants] = useState<string>("");
  const [listeComposants, setListeComposants] = useState<string>("");


  const [atc1Label, setAtc1Label] = useState<string | undefined>(undefined);
  const [atc2Label, setAtc2Label] = useState<string | undefined>(undefined);

  //withAlert
  const [pregnancyPlanAlert, setPregnancyPlanAlert] = useState<boolean>(false);
  const [pregnancyMentionAlert, setPregnancyMentionAlert] = useState<boolean>(false);
  const [pediatricsInfo, setPediatricsInfo] = useState<PediatricsInfo>();

  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);
  const [composantsTruncLength, setComposantsTruncLength] = useState<number>(250);

  useEffect(() => {
    setSpecialitesGroup(item);
    setGroupName(formatSpecName(item.groupName));
    setSpecialites(item.resumeSpecialites);
    setFullListeComposants(item.composants);
    setListeComposants(item.composants.slice(0, composantsTruncLength) + (item.composants.length > composantsTruncLength ? "..." : ""));
    setAtc1Label(item.atc1Label);
    setAtc2Label(item.atc2Label);
  }, [item, composantsTruncLength, setSpecialitesGroup, setGroupName, setSpecialites, setListeComposants, setAtc1Label, setAtc2Label]);

  useEffect(() => {
    if(withAlert 
      && specialitesGroup 
      && specialitesGroup.alerts 
      && filterPregnancy
      && (specialitesGroup.alerts.pregnancyPlanAlert || specialitesGroup.alerts.pregnancyMentionAlert)
    ){
      if (specialitesGroup.alerts.pregnancyPlanAlert) setPregnancyPlanAlert(true)
      else setPregnancyPlanAlert(false);

      if (specialitesGroup.alerts.pregnancyMentionAlert) setPregnancyMentionAlert(true);
      else setPregnancyMentionAlert(false);
    } else {
      setPregnancyPlanAlert(false);
      setPregnancyMentionAlert(false);
    }

  }, [withAlert, filterPregnancy, specialitesGroup, setPregnancyPlanAlert, setPregnancyMentionAlert]);

  useEffect(() => {
    if(withAlert 
      && specialitesGroup 
      && specialitesGroup.alerts
      && filterPediatric 
      && specialitesGroup.alerts.pediatrics
    )
      setPediatricsInfo(specialitesGroup.alerts.pediatrics);
    else
      setPediatricsInfo(undefined);

  }, [withAlert, filterPediatric, specialitesGroup, setPediatricsInfo]);

  function onDetailsVisibles(isVisible: boolean) {
    setIsDetailsVisible(isVisible);
    if(isVisible)
      setListeComposants(fullListeComposants);
    else {
      setListeComposants(fullListeComposants.slice(0, composantsTruncLength) + (fullListeComposants.length > composantsTruncLength ? "..." : ""));
    }
  }

  function updateComposantsTruncLength() {
    if (window.innerWidth <= 768) {
      setComposantsTruncLength(150);
    } else {
      setComposantsTruncLength(250);
    }
  }

  useEffect(() => {
    updateComposantsTruncLength();
    window.addEventListener('resize', updateComposantsTruncLength);
    return () => {
      window.removeEventListener('resize', updateComposantsTruncLength);
    };
  }, []);


  return specialitesGroup && (
    <Container className={fr.cx("fr-mb-1w")}>
      <GreyContainer 
        className={fr.cx("fr-p-1w")}
        $isDetailsVisible={isDetailsVisible}        
        onClick={() => onDetailsVisibles(!isDetailsVisible)}
      >
        <RowToColumnContainer>
          <SpecName className={fr.cx("fr-text--md", "fr-mr-2w")}>{groupName}</SpecName>
          {(specialites && specialites.length > 0) && (
            <SpecLength className={fr.cx("fr-text--sm")}>{specialites.length} {specialites.length > 1 ? "formats de médicament" : " format de médicament"}</SpecLength>
          )}
        </RowToColumnContainer>
        <DetailsContainer>
          <div style={{width: "100%"}}>
            <RowToColumnContainer>
              {(atc1Label || atc2Label) && (
                <span className={fr.cx("fr-text--sm", "fr-mr-2w")}>
                  <GreyText>Classe</GreyText>&nbsp;
                  <DarkGreyText>
                    {atc1Label && atc1Label}
                    {(atc1Label && atc2Label) && ' > '}
                    {atc2Label && atc2Label}
                  </DarkGreyText>
                </span>
              )}
              <span className={fr.cx("fr-text--sm")}>
                <GreyText>Substance&nbsp;active</GreyText>&nbsp;
                <DarkGreyText>
                  {listeComposants}
                </DarkGreyText>
              </span>
            </RowToColumnContainer>
            {(withAlert && (pregnancyPlanAlert || pregnancyMentionAlert || pediatricsInfo)) && (
              <div>
                {pregnancyPlanAlert && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Plan de prévention grossesse pour certains des médicaments</RedText>
                )}
                {(!pregnancyPlanAlert && pregnancyMentionAlert) && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Mention contre-indication grossesse pour certains des médicaments</RedText>
                )}
                {pediatricsInfo && (
                  <>
                    {pediatricsInfo.indication && (
                      <GreenText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Peut être utilisé chez l&apos;enfant selon l&apos;âge</GreenText>
                    )}
                    {pediatricsInfo.contraindication && (
                      <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Contre-indiqué pour un enfant selon l&apos;âge</RedText>                    
                    )}
                    {pediatricsInfo.doctorAdvice && (
                      <YellowText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de santé</YellowText>
                    )}
                    {pediatricsInfo.mention && (
                      <GreenText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Mention contre-indication enfant</GreenText>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <Button
            iconId={isDetailsVisible ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
            onClick={() => onDetailsVisibles(!isDetailsVisible)}
            priority="tertiary no outline"
            title="Liens vers les notices"
            style={{width: "100%"}}
          />
        </DetailsContainer>
      </GreyContainer>
      {(isDetailsVisible && specialites && specialites.length > 0) && (
        <div className={fr.cx("fr-p-1w")}>
          <GreyText className={fr.cx("fr-text--sm")}>Consultez la notice de :</GreyText>
          <ul className={fr.cx("fr-raw-list", "fr-pl-0")}>
            {specialites.map((specialite, i) => (
              <li key={i} className={fr.cx("fr-mb-1v")}>
                <Link
                  href={`/medicaments/${specialite.SpecId}`}
                  className={fr.cx("fr-text--sm", "fr-link")}
                >
                  {formatSpecName(specialite.SpecDenom01)}
                </Link>
                {isAIP(specialite) && (
                  <Tooltip
                    title="Ce médicament est en Autorisation d'Importation parallèle."
                    kind="hover"
                  >
                    <b className={fr.cx("fr-ml-1v", "fr-text--sm")} style={{color: "#89BA12"}}>
                      AIP
                    </b>
                  </Tooltip>
                )}
                {!isCommercialisee(specialite) && (
                  <Tooltip
                    title="Ce médicament n'est ou ne sera bientôt plus disponible sur le marché."
                    kind="hover"
                  >
                    <i 
                      className={fr.cx("fr-icon-close-circle-line", "fr-ml-1v")} 
                      style={{color: "var(--text-action-high-blue-france)"}}
                    />
                  </Tooltip>
                )}
                {isAlerteSecurite(specialite) && (
                  <Tooltip
                    title="Alerte de sécurité sanitaire sur ce médicament, veuillez consulter la notice pour en savoir plus."
                    kind="hover"
                  >
                    <i 
                      className={fr.cx("fr-icon-alert-line", "fr-ml-1v")} 
                      style={{color: "var(--red-marianne-main-472)"}}
                    />
                  </Tooltip>
                )}
                {specialite.isSurveillanceRenforcee && (
                  <Tooltip
                    title="Ce médicament fait l'objet d'une information importante ou il est sous surveillance renforcée."
                    kind="hover"
                  >
                    <i 
                      className={fr.cx("fr-icon-information-line", "fr-ml-1v")} 
                      style={{color: "var(--warning-425-625)"}}
                    />
                  </Tooltip>
                )}
                {(withAlert 
                  && (pregnancyPlanAlert && specialite.alerts && specialite.alerts.pregnancyPlanAlert) 
                  || (pregnancyMentionAlert && specialite.alerts && specialite.alerts.pregnancyMentionAlert)
                  || (pediatricsInfo && specialite.alerts && specialite.alerts.pediatrics)
                ) && (
                  <FiltersTagContainer>
                    {(pregnancyPlanAlert && specialite.alerts.pregnancyPlanAlert) && (
                      <PregnancyPlanTag />
                    )}
                    {((!pregnancyPlanAlert && !specialite.alerts.pregnancyPlanAlert) && pregnancyMentionAlert && specialite.alerts.pregnancyMentionAlert) && (
                      <PregnancyMentionTag />
                    )}
                    {(pediatricsInfo && specialite.alerts.pediatrics) && (
                      <PediatricsTags info={specialite.alerts.pediatrics} />
                    )}
                  </FiltersTagContainer>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
};

export default DataBlockAccordion;
