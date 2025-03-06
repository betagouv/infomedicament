import { PediatricsInfo } from "@/data/grist/pediatrics";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import TagContainer from "./TagContainer";
import { TagTypeEnum } from "@/app/(container)/medicaments/[CIS]/page";

export default function PediatricsTags({ info, lastTagElement }: { info: PediatricsInfo, lastTagElement?: TagTypeEnum }) {
  return (
    <>
      {info.indication && (
        <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PEDIATRIC_INDICATION}>
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
        <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PEDIATRIC_CONTRAINDICATION}>
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
        <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PEDIATRIC_DOCTOR_ADVICE}>
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
