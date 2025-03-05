import { PediatricsInfo } from "@/data/grist/pediatrics";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import TagContainer from "./TagContainer";

export default function PediatricsTags({ info }: { info: PediatricsInfo }) {
  return (
    <>
      {info.indication && (
        <TagContainer>
          <Tag
            iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
            linkProps={{
              href: `#`,
              className: cx("fr-tag--custom-alt-pediatrics-indication"),
            }}
          >
            Peut être utilisé chez l&apos;enfant selon l&apos;âge
          </Tag>
        </TagContainer>
      )}
      {info.contraindication && (
        <TagContainer>
          <Tag
            iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
            linkProps={{
              href: `#`,
              className: cx("fr-tag--custom-alt-contraindication"),
            }}
          >
            Contre-indication chez l&apos;enfant selon l&apos;âge
          </Tag>
        </TagContainer>
      )}
      {info.doctorAdvice && (
        <TagContainer>
          <Tag
            iconId={"fr-icon--custom-bedroom-baby" as FrIconClassName}
            linkProps={{
              href: `#`,
              className: cx("fr-tag--custom-alt-pediatrics-advice"),
            }}
          >
            Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de
            santé
          </Tag>
        </TagContainer>
      )}
    </>
  );
}
