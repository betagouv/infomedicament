"use client";

import { Fragment, HTMLAttributes } from "react";
import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import ClassTag from "../tags/ClassTag";
import { ATC } from "@/types/ATCTypes";
import SubstanceTag from "../tags/SubstanceTag";
import { SpecComposant, Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { displayCompleteComposants, formatSpecName } from "@/displayUtils";
import GenericAccordion from "../GenericAccordion";
import Link from "next/link";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";

interface MedicamentGeneriqueContainerProps extends HTMLAttributes<HTMLDivElement> {
  atc2?: ATC;
  composants : Array<SpecComposant & SubstanceNom>;
  groupName: string;
  specialite: DetailedSpecialite;
  generiques: Specialite[];
}

function MedicamentGeneriqueContainer({
  atc2,
  composants,
  groupName,
  specialite,
  generiques,
  ...props
}: MedicamentGeneriqueContainerProps) {

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
      <p className={fr.cx("fr-mb-1v")}>
        <Link
          className={fr.cx("fr-link")}
          href={`/medicaments/${specialite.SpecId}`}
        >
          {formatSpecName(specialite.SpecDenom01)}
        </Link>
        {specialite.Een && (
          <div className={fr.cx("fr-ml-1w")}>
            Excipient(s) à effet notoire : {specialite.Een}
          </div>
        )}
      </p>
      <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
        {generiques.length} médicament{generiques.length > 1 && "s"} générique
        {generiques.length > 1 && "s"}
      </h2>
      {generiques.map((generique) => (
        <Fragment key={generique.SpecId}>
          <p className={fr.cx("fr-mb-1v")}>
            <Link
              className={fr.cx("fr-link")}
              href={`/medicaments/${generique.SpecId}`}
              >
              {formatSpecName(generique.SpecDenom01)}
            </Link>
            {generique.Een && (
              <div className={fr.cx("fr-ml-1w")}>
                Excipient(s) à effet notoire : {generique.Een}
              </div>
            )}
          </p>
        </Fragment>
      ))}
    </ContentContainer>
  );
};

export default MedicamentGeneriqueContainer;