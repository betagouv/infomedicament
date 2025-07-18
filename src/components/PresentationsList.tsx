import {
  Presentation,
  PresentationComm,
  PresentationStat,
  PresInfoTarif,
} from "@/db/pdbmMySQL/types";
import { Nullable } from "kysely";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { dateShortFormat } from "@/displayUtils";
import React from "react";
import { PresentationDetail } from "@/db/types";
import { capitalize } from "tsafe";

const unitesMesures = [
  "cm2",
  "g",
  "GBq",
  "GBq/ml",
  "kg",
  "l",
  "MBq",
  "MBq/ml",
  "mg",
  "microgrammes",
  "ml",
  "UI",
];

function totalDisplay(p: PresentationDetail): string {
  if(p.nbrrecipient && p.qtecontenance && p.unitecontenance)
    return `${p.nbrrecipient * p.qtecontenance} ${p.unitecontenance.replaceAll("(s)", "s")}`;
  else return "";
}

function contentDisplay(p: PresentationDetail): string {
  if(p.qtecontenance && p.unitecontenance)
    return `${p.qtecontenance} ${p.unitecontenance.replaceAll("(s)", p.qtecontenance && p.qtecontenance > 1 ? "s" : "")}`;
  else return "";
}

function caracCompDisplay(p: PresentationDetail): string {
  return (p.caraccomplrecip && p.caraccomplrecip.startsWith("avec")) ? ` ${p.caraccomplrecip}` : "";
}

function presentationDetailName(p: PresentationDetail): string {
  if(!p.recipient) return "";
  const recipient = p.recipient.replaceAll("thermoformée", "");

  if (p.nbrrecipient > 1) {
    if (
      p.qtecontenance > 1 &&
      p.unitecontenance &&
      !unitesMesures.includes(p.unitecontenance)
    ) {
      return `${totalDisplay(p)} - ${p.nbrrecipient} ${recipient.replaceAll("(s)", "s")}${caracCompDisplay(p)} de ${contentDisplay(p)}`;
    }

    return `${p.nbrrecipient} ${recipient.replaceAll("(s)", "s")}${caracCompDisplay(p)}${p.qtecontenance && p.qtecontenance ? ` de ${contentDisplay(p)}` : ""}`;
  }

  return capitalize(
    `${recipient.replaceAll("(s)", "")}${caracCompDisplay(p)} de ${contentDisplay(p)}`,
  );
}

export function PresentationsList(props: {
  presentations: (Presentation &
    Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
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
        </ul>
      ) : (
        <span>Pas de conditionnement à afficher</span>
      )}
    </>
  );
}
