import { PediatricsInfo } from "@/data/grist/pediatrics";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { fr } from "@codegouvfr/react-dsfr";
import "./dsfr-custom-tags.css";
import TagContainer from "./TagContainer";
import { TagTypeEnum } from "@/types/TagType";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

const modalIndication = createModal({
  id: "pregnancy-subs-modal", 
  isOpenedByDefault: false
});
const modalContraindication = createModal({
  id: "pregnancy-subs-modal", 
  isOpenedByDefault: false
});
const modalDoctorAdvice = createModal({
  id: "pregnancy-subs-modal", 
  isOpenedByDefault: false
});
const modalMention = createModal({
  id: "pregnancy-subs-modal", 
  isOpenedByDefault: false
});

export default function PediatricsTags({ 
  info, 
  lastTagElement 
}: { 
  info: PediatricsInfo, 
  lastTagElement?: TagTypeEnum
}) {
  const hideSeparator = !lastTagElement;
  return (
    <>
      <modalIndication.Component title="">
        <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Peut être utilisé chez l&apos;enfant selon l&apos;âge</h4>
        <span>
          Ce tag indique qu’une information spécifique existe concernant l’usage chez l’enfant. Cela peut signifier que le médicament est contre-indiqué selon l’âge.<br/>
          Vérifiez toujours la tranche d’âge concernée dans la notice et demandez conseil à un professionnel de santé.
        </span>
      </modalIndication.Component>
      <modalContraindication.Component title="">
        <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Contre-indication chez l&apos;enfant selon l&apos;âge</h4>
        <span>
          Ce tag indique qu’une information spécifique existe concernant l’usage chez l’enfant. Cela peut signifier que le médicament est autorisé selon l’âge.<br/>
          Vérifiez toujours la tranche d’âge concernée dans la notice et demandez conseil à un professionnel de santé.
        </span>
      </modalContraindication.Component>
      <modalDoctorAdvice.Component title="">
        <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de santé</h4>
        <span>
          Ce tag indique qu’une information spécifique existe concernant l’usage chez l’enfant. Cela peut signifier que le médicament doit être utilisé avec précaution selon l’âge.<br/>
          Vérifiez toujours la tranche d’âge concernée dans la notice et demandez conseil à un professionnel de santé.
        </span>
      </modalDoctorAdvice.Component>
      <modalMention.Component title="">
        <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Mention contre-indication enfant</h4>
        <span>
          Ce tag indique que ce médicament peut présenter des précautions d’usage pour les enfants et adolescents (moins de 18 ans). Il peut être autorisé, déconseillé ou contre-indiqué selon les cas.<br/>
          Lisez la notice et demandez l’avis d’un professionnel de santé avant toute prise.
        </span>
      </modalMention.Component>
      {info.indication && (
        <TagContainer hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_INDICATION}>
          <Tag
            linkProps={{
              href: `#`,
              onClick: () => modalIndication.open(),
              className: cx("fr-tag--custom-alt-pediatrics-indication"),
            }}
          >
            <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
            <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Peut être utilisé chez l&apos;enfant selon l&apos;âge</span>
          </Tag>
        </TagContainer>
      )}
      {info.contraindication && (
        <TagContainer hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_CONTRAINDICATION}>
          <Tag
            linkProps={{
              href: `#`,
              onClick: () => modalContraindication.open(),
              className: cx("fr-tag--custom-alt-contraindication"),
            }}
          >
            <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
            <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Contre-indication chez l&apos;enfant selon l&apos;âge</span>
          </Tag>
        </TagContainer>
      )}
      {info.doctorAdvice && (
        <TagContainer hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_DOCTOR_ADVICE}>
          <Tag
            linkProps={{
              href: `#`,
              onClick: () => modalDoctorAdvice.open(),
              className: cx("fr-tag--custom-alt-pediatrics-advice"),
            }}
          >
            <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
            <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de santé</span>
          </Tag>
        </TagContainer>
      )}
      {info.mention && (
        <TagContainer hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_MENTION}>
          <Tag
            linkProps={{
              href: `#`,
              onClick: () => modalMention.open(),
              className: cx("fr-tag--custom-alt-pediatrics-indication"),
            }}
          >
            <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
            <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Mention contre-indication enfant</span>
          </Tag>
        </TagContainer>
      )}
    </>
  );
}
