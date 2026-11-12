"use client";

import { HTMLAttributes, useId, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";
import MatchReasonTags from "../tags/MatchReasonTags";
import PediatricsTags from "../tags/PediatricsTags";
import PregnancyMentionTag from "@/components/tags/PregnancyMentionTag";
import PregnancyPlanTag from "@/components/tags/PregnancyPlanTag";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import DataBlockGenericIcons from "./DataBlockGenericIcons";
import { ShortIndication } from "@/types/IndicationsTypes";
import { MatchReason } from "@/types/SearchTypes";
import { getSpecSlug } from "@/utils/specialites";

const GreyContainer = styled.div<{ $isDetailsVisible?: boolean; }>`
  ${props => props.$isDetailsVisible && css`
    border-bottom: var(--border-open-blue-france) 1px solid;
    background-color: var(--background-alt-grey);
    border-radius: 8px 8px 0 0;
  `}
`;
const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
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
const FiltersTagContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  a{
    margin-right: 0.5rem;
    margin-top: 0.2rem;
  }
`;
const SpecLine = styled.li`
  display: flex;
`;

interface DataBlockAccordionProps extends HTMLAttributes<HTMLDivElement> {
  item: ResumeSpecGroup;
  matchReasons?: MatchReason[];
  withAlert?: boolean;
}

function getSubstancePreview(text: string) {
  const maxLength = 250;
  if (text.length <= maxLength) return text;

  // Keep whole words, even if the first word alone exceeds the preview limit.
  const words = text.trim().split(/\s+/u);
  let preview = words[0];
  for (const word of words.slice(1)) {
    if (preview.length + word.length + 1 > maxLength) break;
    preview += ` ${word}`;
  }
  return preview.length < text.trim().length ? `${preview}…` : text;
}

//For now only for type === DataTypeEnum.MEDICAMENT
function DataBlockAccordion({
  item,
  matchReasons,
  withAlert
}: DataBlockAccordionProps) {

  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);
  const componentsId = useId();
  const detailsId = useId();

  const groupName = formatSpecName(item.groupName);
  const specialites = item.shortSpecialites;
  const { atc1Label, atc2Label } = item;
  const listIndications = item.indicationsDetails ?? [];
  const substanceText = isDetailsVisible ? item.composants : getSubstancePreview(item.composants);
  const pregnancyPlanAlert = Boolean(withAlert && item.alerts?.pregnancyPlanAlert);
  const pregnancyMentionAlert = Boolean(withAlert && item.alerts?.pregnancyMentionAlert);
  const pediatricsInfo = withAlert ? item.alerts?.pediatrics : undefined;

  function getIndicationsText(indicationsDetails: ShortIndication[]) {
    let newListIndications: string = "";
    indicationsDetails.forEach((indication) => {
      newListIndications += (newListIndications !== "" ? ", " : "") + indication.nomIndication;
    })
    return newListIndications;
  }

  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <GreyContainer 
        className={fr.cx("fr-p-1w")}
        $isDetailsVisible={isDetailsVisible}
      >
        <RowToColumnContainer>
          <SpecName className={fr.cx("fr-text--md", "fr-mr-2w")}>{groupName}</SpecName>
          {(specialites && specialites.length > 0) && (
            <SpecLength className={fr.cx("fr-text--sm")}>{specialites.length} {specialites.length > 1 ? "formats de médicament" : " format de médicament"}</SpecLength>
          )}
        </RowToColumnContainer>
        {matchReasons && <MatchReasonTags reasons={matchReasons} />}
        <DetailsContainer>
          <div style={{ flex: 1, minWidth: 0 }}>
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
              <span id={componentsId} className={fr.cx("fr-text--sm")}>
                <GreyText>Substance&nbsp;active</GreyText>&nbsp;
                <DarkGreyText>
                  {substanceText}
                </DarkGreyText>
              </span>
               {listIndications.length > 0 && (
                <span className={fr.cx("fr-text--sm", "fr-ml-2w")}>
                  <GreyText>Indication{listIndications.length > 1 && 's'}</GreyText>&nbsp;
                  <DarkGreyText>
                    {getIndicationsText(listIndications)}
                  </DarkGreyText>
                </span>
              )}
            </RowToColumnContainer>
            {(withAlert && (pregnancyPlanAlert || pregnancyMentionAlert || pediatricsInfo)) && (
              <div>
                {pregnancyPlanAlert && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Plan de prévention grossesse pour certains des médicaments</RedText>
                )}
                {(!pregnancyPlanAlert && pregnancyMentionAlert) && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Mention contre-indication grossesse pour certains des médicaments</RedText>
                )}
                {(pediatricsInfo && pediatricsInfo.contraindication) && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Contre-indiqué pour un enfant selon l&apos;âge</RedText>                    
                )}
              </div>
            )}
          </div>
          <Button
            iconId={isDetailsVisible ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
            onClick={() => setIsDetailsVisible((visible) => !visible)}
            priority="tertiary no outline"
            title={isDetailsVisible ? "Réduire les informations" : "Afficher toutes les informations et les liens vers les notices"}
            aria-expanded={isDetailsVisible}
            aria-controls={`${componentsId} ${detailsId}`}
            style={{ flexShrink: 0 }}
          />
        </DetailsContainer>
      </GreyContainer>
      <div id={detailsId} hidden={!isDetailsVisible}>
        {(specialites && specialites.length > 0) && (
          <div className={fr.cx("fr-p-1w")}>
            <GreyText className={fr.cx("fr-text--sm")}>Consultez la notice de :</GreyText>
            <ul className={fr.cx("fr-raw-list", "fr-pl-0")}>
              {specialites.map((specialite, i) => (
                <SpecLine key={i} className={fr.cx("fr-mb-1v")}>
                  <Link
                    href={`/medicaments/${getSpecSlug(specialite.SpecId, specialite.SpecDenom01)}`}
                    className={fr.cx("fr-text--sm", "fr-link")}
                  >
                    {formatSpecName(specialite.SpecDenom01)}
                  </Link>
                  <DataBlockGenericIcons
                    specialite={specialite}
                    isSurveillanceRenforcee={specialite.isSurveillanceRenforcee}
                  />
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
                </SpecLine>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Container>
  );
};

export default DataBlockAccordion;
