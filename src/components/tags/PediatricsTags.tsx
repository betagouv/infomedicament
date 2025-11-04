import { PediatricsInfo } from "@/data/grist/pediatrics";
import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { fr } from "@codegouvfr/react-dsfr";
import "./dsfr-custom-tags.css";
import TagContainer from "./TagContainer";
import { TagTypeEnum } from "@/types/TagType";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import styled from 'styled-components';
import { trackEvent } from "@/services/tracking";

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

const ModalContent = styled.div`
  h4::before {
    margin-right: 0.4rem;
  }
`;

interface PediatricsTagsProps extends HTMLAttributes<HTMLDivElement> {
  info?: PediatricsInfo;
  lastTagElement?: TagTypeEnum;
  fromMedicament?: boolean;
}

export default function PediatricsTags({ 
  info, 
  lastTagElement,
  fromMedicament
}: PediatricsTagsProps) {
  const hideSeparator = !lastTagElement;

  const onTrackEvent = (event: string) => {
    if(fromMedicament)
      trackEvent("Page médicament", event);
  };

  return info && (
    <>
      {info.indication && (
        <div>
          <modalIndication.Component title="">
            <ModalContent>
              <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Peut être utilisé chez l&apos;enfant selon l&apos;âge</h4>
              <span>
                Ce tag indique qu’une information spécifique existe concernant l’usage chez l’enfant. Cela peut signifier que le médicament est contre-indiqué selon l’âge.<br/>
                Vérifiez toujours la tranche d’âge concernée dans la notice et demandez conseil à un professionnel de santé.
              </span>
            </ModalContent>
          </modalIndication.Component>
          <TagContainer 
            className={fr.cx("fr-mt-1w", "fr-mr-1w")}
            hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_INDICATION}
          >
            <Tag
              linkProps={{
                href: `#`,
                onClick: () => {
                  onTrackEvent("Tag Enfant selon l'âge");
                  modalIndication.open();
                },
                className: cx("fr-tag--custom-alt-pediatrics-indication"),
              }}
            >
              <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
              <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Peut être utilisé chez l&apos;enfant selon l&apos;âge</span>
            </Tag>
          </TagContainer>
        </div>
      )}
      {info.contraindication && (
        <div>
          <modalContraindication.Component title="">
            <ModalContent>
              <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Contre-indication chez l&apos;enfant selon l&apos;âge</h4>
              <span>
                Ce tag indique qu’une information spécifique existe concernant l’usage chez l’enfant. Cela peut signifier que le médicament est autorisé selon l’âge.<br/>
                Vérifiez toujours la tranche d’âge concernée dans la notice et demandez conseil à un professionnel de santé.
              </span>
            </ModalContent>
          </modalContraindication.Component>
          <TagContainer 
            className={fr.cx("fr-mt-1w", "fr-mr-1w")}
            hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_CONTRAINDICATION}
          >
            <Tag
              linkProps={{
                href: `#`,
                onClick: () => {
                  onTrackEvent("Tag Contre-indication chez l'enfant");
                  modalContraindication.open();
                },
                className: cx("fr-tag--custom-alt-contraindication"),
              }}
            >
              <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
              <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Contre-indication chez l&apos;enfant selon l&apos;âge</span>
            </Tag>
          </TagContainer>
        </div>
      )}
      {info.doctorAdvice && (
        <div>
          <modalDoctorAdvice.Component title="">
            <ModalContent>
              <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de santé</h4>
              <span>
                Ce tag indique qu’une information spécifique existe concernant l’usage chez l’enfant. Cela peut signifier que le médicament doit être utilisé avec précaution selon l’âge.<br/>
                Vérifiez toujours la tranche d’âge concernée dans la notice et demandez conseil à un professionnel de santé.
              </span>
            </ModalContent>
          </modalDoctorAdvice.Component>
          <TagContainer
            className={fr.cx("fr-mt-1w", "fr-mr-1w")}
            hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_DOCTOR_ADVICE}
          >
            <Tag
              linkProps={{
                href: `#`,
                onClick: () => {
                  onTrackEvent("Tag Enfant avis professionnel de santé");
                  modalDoctorAdvice.open();
                },
                className: cx("fr-tag--custom-alt-pediatrics-advice"),
              }}
            >
              <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
              <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Utilisation chez l&apos;enfant sur avis d&apos;un professionnel de santé</span>
            </Tag>
          </TagContainer>
        </div>
      )}
      {info.mention && (
        <div>
          <modalMention.Component title="">
            <ModalContent>
              <h4 className={"fr-icon--custom-bedroom-baby" as FrIconClassName}>Mention contre-indication enfant</h4>
              <span>
                Ce tag indique que ce médicament peut présenter des précautions d’usage pour les enfants et adolescents (moins de 18 ans). Il peut être autorisé, déconseillé ou contre-indiqué selon les cas.<br/>
                Lisez la notice et demandez l’avis d’un professionnel de santé avant toute prise.
              </span>
            </ModalContent>
          </modalMention.Component>
          <TagContainer
            className={fr.cx("fr-mt-1w", "fr-mr-1w")}
            hideSeparator={hideSeparator || lastTagElement === TagTypeEnum.PEDIATRIC_MENTION}
          >
            <Tag
              linkProps={{
                href: `#`,
                onClick: () => {
                  onTrackEvent("Tag Mention contre-indication enfant");
                  modalMention.open();
                },
                className: cx("fr-tag--custom-alt-pediatrics-indication"),
              }}
            >
              <span className={["fr-icon--custom-bedroom-baby" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
              <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Mention contre-indication enfant</span>
            </Tag>
          </TagContainer>
        </div>
      )}
    </>
  );
}
