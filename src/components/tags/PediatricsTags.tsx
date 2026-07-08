"use client";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { HTMLAttributes } from "react";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { fr } from "@codegouvfr/react-dsfr";
import "./dsfr-custom-tags.css";
import TagContainer from "./TagContainer";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import styled from 'styled-components';
import { PediatricsInfo } from "@/types/PediatricTypes";
import { trackEvent } from "@/services/tracking";

const modalContraindication = createModal({
  id: "pediatric-contraindication-modal", 
  isOpenedByDefault: false
});

const ModalContent = styled.div`
  h4::before {
    margin-right: 0.4rem;
  }
`;

interface PediatricsTagsProps extends HTMLAttributes<HTMLDivElement> {
  info?: PediatricsInfo;
  fromMedicament?: boolean;
}

export default function PediatricsTags({ 
  info, 
  fromMedicament,
}: PediatricsTagsProps) {
  
  const onTrackEvent = (event: string) => {
    if(fromMedicament)
      trackEvent("Page médicament", event);
  };

  return info && info.contraindication && (
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
        hideSeparator
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
          <span className={fr.cx("fr-text--sm")}>Contre-indication chez l&apos;enfant selon l&apos;âge</span>
        </Tag>
      </TagContainer>
    </div>
  );
}
