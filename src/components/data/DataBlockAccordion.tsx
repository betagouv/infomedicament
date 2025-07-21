"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";
import PediatricsTags from "../tags/PediatricsTags";
import { AdvancedMedicamentGroup, AdvancedSpecialite } from "@/types/MedicamentTypes";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import PregnancyCISTag from "../tags/PregnancyCISTag";
import PregnancySubsTag from "../tags/PregnancySubsTag";

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
  item: AdvancedMedicamentGroup;
  filterPregnancy?: boolean;
  filterPediatric?: boolean;
}

//For now only for type === DataTypeEnum.MEDGROUP
function DataBlockAccordion({
  item,
  filterPregnancy,
  filterPediatric
}: DataBlockAccordionProps) {

  const [advancedMedicamentGroup, setAdvancedMedicamentGroup] = useState<AdvancedMedicamentGroup>();
  const [groupName, setGroupName] = useState<string>("");
  const [specialites, setSpecialites] = useState<AdvancedSpecialite[]>();
  const [listeComposants, setListeComposants] = useState<string>("");
  const [pregnancySubsAlert, setPregnancySubsAlert] = useState<boolean>(false);
  const [pregnancyCISAlert, setPregnancyCISAlert] = useState<boolean>(false);
  const [pediatricsInfo, setPediatricsInfo] = useState<PediatricsInfo>();

  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);

  useEffect(() => {
    setAdvancedMedicamentGroup(item);
    setGroupName(formatSpecName(item.groupName));
    setSpecialites(item.specialites);
    setListeComposants(
      displaySimpleComposants(item.composants)
        .map((s) => s.NomLib.trim())
        .join(", ")
    );
  }, [item, setAdvancedMedicamentGroup, setGroupName, setSpecialites, setListeComposants]);

  useEffect(() => {
    if(advancedMedicamentGroup && filterPregnancy){
      if (advancedMedicamentGroup.pregnancySubsAlert) setPregnancySubsAlert(true)
      else setPregnancySubsAlert(false);

      if (advancedMedicamentGroup.pregnancyCISAlert) setPregnancyCISAlert(true);
      else setPregnancyCISAlert(false);
    } else {
      setPregnancySubsAlert(false);
      setPregnancyCISAlert(false);
    }

  }, [filterPregnancy, advancedMedicamentGroup, setPregnancySubsAlert, setPregnancyCISAlert]);

  useEffect(() => {
    if(advancedMedicamentGroup && filterPediatric && advancedMedicamentGroup.pediatrics)
      setPediatricsInfo(advancedMedicamentGroup.pediatrics);
    else
      setPediatricsInfo(undefined);

  }, [filterPediatric, advancedMedicamentGroup, setPediatricsInfo]);

  return advancedMedicamentGroup && (
    <Container className={fr.cx("fr-mb-1w")}>
      <GreyContainer 
        className={fr.cx("fr-p-1w")}
        $isDetailsVisible={isDetailsVisible}
        onClick={() => setIsDetailsVisible(!isDetailsVisible)}
      >
        <RowToColumnContainer>
          <SpecName className={fr.cx("fr-text--md", "fr-mr-2w")}>{groupName}</SpecName>
          {(specialites && specialites.length > 0) && (
            <SpecLength className={fr.cx("fr-text--sm")}>{specialites.length} {specialites.length > 1 ? "formats de médicament" : " format de médicament"}</SpecLength>
          )}
        </RowToColumnContainer>
        <DetailsContainer>
          <div>
            <RowToColumnContainer>
              {(advancedMedicamentGroup.atc1 || advancedMedicamentGroup.atc2) && (
                <span className={fr.cx("fr-text--sm", "fr-mr-2w")}>
                  <GreyText>Classe</GreyText>&nbsp;
                  <DarkGreyText>
                    {advancedMedicamentGroup.atc1 && advancedMedicamentGroup.atc1.label}
                    {(advancedMedicamentGroup.atc1 && advancedMedicamentGroup.atc2) && ' > '}
                    {advancedMedicamentGroup.atc2 && advancedMedicamentGroup.atc2.label}
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
            {(pregnancySubsAlert || pregnancyCISAlert || pediatricsInfo) && (
              <div>
                {pregnancyCISAlert && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Mention contre-indication grossesse pour certains des médicaments</RedText>
                )}
                {pregnancySubsAlert && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Plan de prévention grossesse pour certains des médicaments</RedText>
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
            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
            priority="tertiary no outline"
            title="Liens vers les notices"
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
                {((pregnancySubsAlert && specialite.pregnancySubsAlert) || (pregnancyCISAlert && specialite.pregnancyCISAlert) || (pediatricsInfo && specialite.pediatrics)) && (
                  <FiltersTagContainer>
                    {(pregnancyCISAlert && specialite.pregnancyCISAlert) && (
                      <PregnancyCISTag />
                    )}
                    {(pregnancySubsAlert && specialite.pregnancySubsAlert) && (
                      <PregnancySubsTag />
                    )}
                    {(pediatricsInfo && specialite.pediatrics) && (
                      <PediatricsTags info={specialite.pediatrics} />
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
