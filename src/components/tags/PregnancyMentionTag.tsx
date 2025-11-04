"use client"; 

import Tag from "@codegouvfr/react-dsfr/Tag";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { fr } from "@codegouvfr/react-dsfr";
import "./dsfr-custom-tags.css";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import styled from 'styled-components';
import TagContainer from "./TagContainer";
import { trackEvent } from "@/services/tracking";

const modal = createModal({
  id: "pregnancy-cis-modal", 
  isOpenedByDefault: false
});

const ModalContent = styled.div`
  h4::before {
    margin-right: 0.4rem;
  }
`;

interface PregnancyMentionTagProps extends HTMLAttributes<HTMLDivElement> {
  fromMedicament?: boolean;
}

function PregnancyMentionTag({
  fromMedicament,
}: PregnancyMentionTagProps) {

  const onTrackEvent = () => {
    if(fromMedicament)
      trackEvent("Page médicament", "Tag Mention contre-indication grossesse");
  };

  return (
    <div>
      <modal.Component title="">
        <ModalContent>
          <h4 className={"fr-icon--custom-pregnancy" as FrIconClassName}>Mention contre-indication grossesse</h4>
          <span>
            Ce tag indique que ce médicament peut présenter des précautions d’usage pendant la grossesse ou l’allaitement. Il peut être autorisé, déconseillé ou contre-indiqué selon les cas.<br/>
            Lisez la notice et demandez l’avis d’un professionnel de santé avant toute prise.
          </span>
        </ModalContent>
      </modal.Component>
      <TagContainer 
        className={fr.cx("fr-mt-1w", "fr-mr-1w")}
        hideSeparator
      >
        <Tag
          linkProps={{
            href: "#",
            onClick: () => {
              onTrackEvent();
              modal.open();
            },
            className: cx("fr-tag--custom-alt-contraindication"),
          }}
        >
          <span className={["fr-icon--custom-pregnancy" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")} />
          <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Mention contre-indication grossesse</span>
        </Tag>
      </TagContainer>
    </div>
  );
}

export default PregnancyMentionTag;
