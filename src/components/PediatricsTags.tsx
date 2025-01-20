import { PediatricsInfo } from "@/data/grist/pediatrics";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";

export default function PediatricsTags({ info }: { info: PediatricsInfo }) {
  return (
    <>
      {info.indication && (
        <Tag
          small
          iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
          linkProps={{
            href: `#`,
            className: fr.cx("fr-tag--green-emeraude"),
          }}
        >
          Peut être utilisé chez l&apos;enfant selon l&apos;âge
        </Tag>
      )}
      {info.contraindication && (
        <Tag
          small
          iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
          linkProps={{
            href: `#`,
            className: fr.cx("fr-tag--orange-terre-battue"),
          }}
        >
          Contre-indication chez l&apos;enfant selon l&apos;âge
        </Tag>
      )}
      {info.doctorAdvice && (
        <Tag
          small
          iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
          linkProps={{
            href: `#`,
            className: fr.cx("fr-tag--yellow-tournesol"),
          }}
        >
          Utilisation chez l&apos;enfant sur avis médical
        </Tag>
      )}
    </>
  );
}
