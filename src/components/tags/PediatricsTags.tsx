import { PediatricsInfo } from "@/data/grist/pediatrics";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";

export default function PediatricsTags({ info }: { info: PediatricsInfo }) {
  return (
    <>
      {info.indication && (
        <Tag
          small
          iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
          linkProps={{
            href: `#`,
            className: cx("fr-tag--custom-alt-pediatrics-indication"),
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
            className: cx("fr-tag--custom-alt-contraindication"),
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
            className: cx("fr-tag--custom-alt-pediatrics-advice"),
          }}
        >
          Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de
          santé
        </Tag>
      )}
    </>
  );
}
