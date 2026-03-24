import {
  PresentationComm,
  PresentationStat,
} from "@/db/pdbmMySQL/types";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { dateShortFormat } from "@/displayUtils";
import React from "react";
import { Presentation } from "@/types/PresentationTypes";
import { getPresentationName, getPresentationPriceText, isAbrogee, isArret } from "@/utils/presentations";

export function PresentationsList(props: {
  presentations: Presentation[];
}) {
  return (
    <>
      <h3 className={fr.cx("fr-h6")}>
        <span className={fr.cx("fr-hidden-md")}>Conditionnement</span>
        <span className={fr.cx("fr-hidden", "fr-unhidden-md")}>Conditionnement et prix</span>
      </h3>
      {(props.presentations && props.presentations.length > 0) ? (
        <ul className={fr.cx("fr-raw-list")}>
          {props.presentations.map((p, index) => (
            <li key={`${p.Cip13}-${index}`} className={fr.cx("fr-mb-1w")}>
              <span
                className={["fr-icon--custom-box", fr.cx("fr-mr-1w")].join(" ")}
              />
              <b>            
                {getPresentationName(p, true)}
              </b>
              <div>{getPresentationPriceText(p)}</div>
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
    </>
  );
}
