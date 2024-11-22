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

export function PresentationsList(props: {
  presentations: (Presentation & Nullable<PresInfoTarif>)[];
}) {
  return (
    <ul className={fr.cx("fr-raw-list")}>
      {props.presentations.map((p) => (
        <li key={p.Cip13} className={fr.cx("fr-mb-1w")}>
          <span
            className={["fr-icon--custom-box", fr.cx("fr-mr-1w")].join(" ")}
          />
          <b>{p.PresNom01}</b> -{" "}
          {p.Prix && p.Taux ? (
            <>
              Prix {p.Prix} € - remboursé à {p.Taux}
            </>
          ) : (
            <>Prix libre - non remboursable</>
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
  );
}
