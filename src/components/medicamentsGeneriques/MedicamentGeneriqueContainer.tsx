"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import ClassTag from "../tags/ClassTag";
import { ATC } from "@/types/ATCTypes";
import SubstanceTag from "../tags/SubstanceTag";
import { VUEvnts } from "@/db/pdbmMySQL/types";
import { AnsmSpecialiteWithStatus } from "@/types/SpecialiteTypes";
import { AnsmComposant } from "@/db/types";
import { displayCompleteComposants } from "@/displayUtils";
import GenericAccordion from "../GenericAccordion";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import DataBlockSpecGenerique from "../data/DataBlockSpecGenerique";
import { getEvents } from "@/db/utils/ficheInfos";
import { isSurveillanceRenforcee } from "@/utils/specialites";

interface MedicamentGeneriqueContainerProps extends HTMLAttributes<HTMLDivElement> {
  atc2?: ATC;
  composants: AnsmComposant[];
  groupName: string;
  princeps: DetailedSpecialite;
  generiques: AnsmSpecialiteWithStatus[];
}

function MedicamentGeneriqueContainer({
  atc2,
  composants,
  groupName,
  princeps,
  generiques,
  ...props
}: MedicamentGeneriqueContainerProps) {

  const [events, setEvents] = useState<VUEvnts[]>();

  //Load all the events of the generiques + princeps
  const loadEvents = useCallback(
    async (
      CISList: string[]
    ) => {
      try {
        const allEvents = await getEvents(CISList);
        setEvents(allEvents);
      } catch (e) {
        Sentry.captureException(e);
      }
    },
    [setEvents]
  );

  useEffect(() => {
    const CISList = [];
    if (generiques) {
      generiques.forEach((generique) => CISList.push(generique.cis));
    }
    if(princeps)
      CISList.push(princeps.cis);
    if(CISList.length > 0)
      loadEvents(CISList);
  }, [generiques, princeps, loadEvents]);
  return (
    <ContentContainer frContainer {...props}>              
      <ul className={fr.cx("fr-tags-group", "fr-mb-1v")}>
        {atc2 && (<ClassTag atc2={atc2} />)}
        <SubstanceTag composants={composants} />
      </ul>
      <div className={"fr-mb-1w"}>
        <span
          className={["fr-icon--custom-molecule", fr.cx("fr-mr-1w")].join(
            " ",
          )}
        />
        <b>Substance active</b>
        <br />
        {displayCompleteComposants(composants)}
      </div>
      <div className={"fr-mb-2w"}>
        <b>Dénomination commune internationale (DCI)</b>
        <br />
        {groupName}
      </div>
      <GenericAccordion />

      <h2 className={fr.cx("fr-h6", "fr-mt-2w", "fr-mb-1w")}>
        Médicament princeps
      </h2>
      <DataBlockSpecGenerique 
          key={princeps.cis}
          specialite={princeps}
          isSurveillanceRenforcee={false}
        />
      <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
        {generiques.length} médicament{generiques.length > 1 && "s"} générique
        {generiques.length > 1 && "s"}
      </h2>
      {generiques.map((generique) => (
        <DataBlockSpecGenerique
          key={generique.cis}
          specialite={generique}
          isSurveillanceRenforcee={events && isSurveillanceRenforcee(events.filter((event) => event.SpecId === generique.cis))}
        />
      ))}
    </ContentContainer>
  );
};

export default MedicamentGeneriqueContainer;