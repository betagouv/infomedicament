import {
  PresentationComm,
  PresentationStat,
} from "@/db/pdbmMySQL/types";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { dateShortFormat } from "@/displayUtils";
import { HTMLAttributes, useEffect, useState } from "react";
import { AgregatePresentationDetails, Presentation, PresentationRecipientsDetails } from "@/types/PresentationTypes";
import { cleanPresentationsDetails, getPresentationPriceText, getPresentationTauxPriseEnChargeText, isAbrogee, isArret, getAgregatePresentationRecipientsTexts } from "@/utils/presentations";
import styled from "styled-components";

type PresentationToDisplay = {
  presentation: Presentation;
  detailsLines: PresentationRecipientsDetails[][];
}

const PriceContainer = styled.span`
  font-size: 1.25rem;
  @media (max-width: 48em) {
    font-size: 1.125rem;
  }
`;

const PresentationsContainer = styled.div`
  @media (max-width: 48em) {
    ul {
      display: inline-flex;
      width: 100%;
      li {
        display: block;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        min-width: 200px;
        border-right: solid 2px var(--background-default-grey-hover);
      }
      li:first-child {
        padding-left: 0px;
        min-width: calc(200px - 0.5rem);
      }
      li:last-child {
        padding-right: 0px;
        min-width: calc(200px - 0.5rem - 2px);
        border: none;
      }
    }
  }
`;

interface PresentationsListProps extends HTMLAttributes<HTMLDivElement> {
  presentations: Presentation[];
}

export function PresentationsList({
  presentations, 
  ...props
}: PresentationsListProps) {

const [presentationsDetails, setPresentationsDetails] = useState<PresentationToDisplay[]>([]);


  useEffect(() => {
    const newPresentationsDetails:PresentationToDisplay[] = [];
    if(presentations){
      presentations.forEach((presentation) => {
        const newPresentationDetails: PresentationToDisplay = {
          presentation: presentation,
          detailsLines: [],
        }
        if(presentation.details) {
          const agregateDetails: AgregatePresentationDetails[] = cleanPresentationsDetails(presentation.details);
          agregateDetails.forEach((details) => {
            const recipientsTexts = getAgregatePresentationRecipientsTexts(details);
            newPresentationDetails.detailsLines.push(recipientsTexts);
          });
        }
        newPresentationsDetails.push(newPresentationDetails);
      })
    }
    setPresentationsDetails(newPresentationsDetails);
  }, [presentations, setPresentationsDetails]);

  return (
    <PresentationsContainer {...props}>
      {(presentationsDetails && presentationsDetails.length > 0) ? (
        <ul className={fr.cx("fr-raw-list")}>
          {presentationsDetails.map((presDetails, index) => (
            <li 
              key={`${presDetails.presentation.Cip13}-${index}`} 
              className={fr.cx("fr-mb-1w", "fr-col-md-12", "fr-text--sm")}
            >
              <div>
                <div>
                  <PriceContainer 
                    className={fr.cx("fr-text--bold", "fr-mr-1w")}
                  >
                    {getPresentationPriceText(presDetails.presentation)}
                    <br className={fr.cx("fr-hidden-md")} />
                  </PriceContainer>
                  <span>{getPresentationTauxPriseEnChargeText(presDetails.presentation)}</span>
                </div>
                <div>
                  {presDetails.detailsLines.map((details, i) => {
                    return details.map((line, j) => (
                      <span key={`${i}-${j}`}>
                        {line.contenance && (
                          <strong>{line.contenance}</strong>
                        )}
                        {line.recipient && (
                          <span>
                            {line.contenance && ' - '}
                            {line.recipient}
                          </span>
                        )}
                      </span>
                    ))
                  })}
                </div>
              </div>
              {isArret(presDetails.presentation) && (
                <Badge severity="warning" className={fr.cx("fr-ml-1v", "fr-mt-1v")}>
                  {PresentationComm[presDetails.presentation.CommId]}
                  {presDetails.presentation.PresCommDate && ` (${dateShortFormat(presDetails.presentation.PresCommDate)})`}
                </Badge>
              )}
              {presDetails.presentation.StatId && isAbrogee(presDetails.presentation) && (
                <Badge severity="error" className={fr.cx("fr-ml-1v", "fr-mt-1v")}>
                  {PresentationStat[presDetails.presentation.StatId]}
                  {presDetails.presentation.PresStatDAte && ` (${dateShortFormat(presDetails.presentation.PresStatDAte)})`}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <span
          className={fr.cx("fr-text--sm")}
        >
          Pas de conditionnement à afficher
        </span>
      )}
    </PresentationsContainer>
  );
}
