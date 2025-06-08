"use client";

import { HTMLAttributes, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";
import PregnancyTag from "../tags/PregnancyTag";
import PediatricsTags from "../tags/PediatricsTags";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";

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

const WhiteContainer = styled.div``;
const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

  const specialites = item.specialites;
  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);

  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <GreyContainer 
        className={fr.cx("fr-p-1w")}
        $isDetailsVisible={isDetailsVisible}
        onClick={() => setIsDetailsVisible(!isDetailsVisible)}
      >
        <div>
          <SpecName className={fr.cx("fr-text--md", "fr-mr-2w")}>{formatSpecName(item.groupName)}</SpecName>
          <SpecLength className={fr.cx("fr-text--sm")}>{specialites.length} {specialites.length > 1 ? "médicaments" : "médicament"}</SpecLength>
        </div>
        <DetailsContainer>
          <div>
            <span className={fr.cx("fr-text--sm", "fr-mr-2w")}>
              <GreyText>Classe</GreyText>&nbsp;
              <DarkGreyText>{item.atc1.label}&nbsp;{'>'}&nbsp;{item.atc2.label}</DarkGreyText>
            </span>
            <span className={fr.cx("fr-text--sm")}>
              <GreyText>Substance&nbsp;active</GreyText>&nbsp;
              <DarkGreyText>
                {displaySimpleComposants(item.composants)
                  .map((s) => s.NomLib.trim())
                  .join(", ")}
              </DarkGreyText>
            </span>
            {((filterPregnancy && item.pregnancyAlert) || (filterPediatric && item.pediatrics)) && (
              <div>
                {(filterPregnancy && item.pregnancyAlert) && (
                  <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Contre-indication grossesse pour certains des médicaments</RedText>
                )}
                {(filterPediatric && item.pediatrics) && (
                  <>
                    {item.pediatrics.indication && (
                      <GreenText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Peut être utilisé chez l&apos;enfant selon l&apos;âge</GreenText>
                    )}
                    {item.pediatrics.contraindication && (
                      <RedText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Contre-indiqué pour un enfant selon l&apos;âge</RedText>                    
                    )}
                    {item.pediatrics.doctorAdvice && (
                      <YellowText className={fr.cx("fr-text--sm", "fr-mr-2w")}>Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de santé</YellowText>
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
      {isDetailsVisible && (
        <WhiteContainer className={fr.cx("fr-p-1w")}>
          <GreyText className={fr.cx("fr-text--sm")}>Consultez la notice de :</GreyText>
          <ul className={fr.cx("fr-raw-list", "fr-pl-0")}>
            {specialites?.map((specialite, i) => (
              <li key={i} className={fr.cx("fr-mb-1v")}>
                <Link
                  href={`/medicaments/${specialite.SpecId}`}
                  className={fr.cx("fr-text--sm", "fr-link")}
                >
                  {formatSpecName(specialite.SpecDenom01)}
                </Link>
                {((filterPregnancy && specialite.pregnancyAlert) || (filterPediatric && specialite.pediatrics)) && (
                  <FiltersTagContainer>
                    {(filterPregnancy && specialite.pregnancyAlert) && (
                      <PregnancyTag />
                    )}
                    {(filterPediatric && specialite.pediatrics) && (
                      <PediatricsTags info={specialite.pediatrics} />
                    )}
                  </FiltersTagContainer>
                )}
              </li>
            ))}
          </ul>
        </WhiteContainer>
      )}
    </Container>
  );
};

export default DataBlockAccordion;
