import {
  PresentationComm,
  PresentationStat,
} from "@/db/pdbmMySQL/types";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { dateShortFormat } from "@/displayUtils";
import React, { HTMLAttributes } from "react";
import { Presentation } from "@/types/PresentationTypes";
import { getPresentationPriceText, getPresentationRecipientsText, getPresentationTauxPriseEnChargeText, isAbrogee, isArret } from "@/utils/presentations";
import styled from "styled-components";

const PriceContainer = styled.span`
  font-size: 1.4rem;
  @media (max-width: 48em) {
    font-size: 1.2rem;
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
  return (
    <PresentationsContainer {...props}>
      {(presentations && presentations.length > 0) ? (
        <ul className={fr.cx("fr-raw-list")}>
          {presentations.map((p, index) => (
            <li 
              key={`${p.Cip13}-${index}`} 
              className={fr.cx("fr-mb-1w", "fr-col-md-12", "fr-text--sm")}
            >
              <div>
                <PriceContainer 
                  className={fr.cx("fr-text--bold", "fr-mr-1w")}
                >
                  {getPresentationPriceText(p)}
                  <br className={fr.cx("fr-hidden-md")} />
                </PriceContainer>
                <span>{getPresentationTauxPriseEnChargeText(p)}</span>
              </div>
              <div>            
                {getPresentationRecipientsText(p)}
              </div>
              {isArret(p) && (
                <Badge severity="warning" className={fr.cx("fr-ml-1v", "fr-mt-1v")}>
                  {PresentationComm[p.CommId]}
                  {p.PresCommDate && ` (${dateShortFormat(p.PresCommDate)})`}
                </Badge>
              )}
              {p.StatId && isAbrogee(p) && (
                <Badge severity="error" className={fr.cx("fr-ml-1v", "fr-mt-1v")}>
                  {PresentationStat[p.StatId]}
                  {p.PresStatDAte && ` (${dateShortFormat(p.PresStatDAte)})`}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <span>Pas de conditionnement à afficher</span>
      )}
    </PresentationsContainer>
  );
}
