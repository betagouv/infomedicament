"use client"; 

import Tag from "@codegouvfr/react-dsfr/Tag";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { fr } from "@codegouvfr/react-dsfr";
import "./dsfr-custom-tags.css";
import { createModal } from "@codegouvfr/react-dsfr/Modal";

const modal = createModal({
  id: "pregnancy-cis-modal", 
  isOpenedByDefault: false
});

function PregnancyCISTag() {

  return (
    <>
      <modal.Component title="">
        <h4 className={"fr-icon--custom-pregnancy" as FrIconClassName}>Mention contre-indication grossesse</h4>
        <span>
          Ce tag indique que ce médicament peut présenter des précautions d’usage pendant la grossesse ou l’allaitement. Il peut être autorisé, déconseillé ou contre-indiqué selon les cas.<br/>
          Lisez la notice et demandez l’avis d’un professionnel de santé avant toute prise.
        </span>
      </modal.Component>
      <Tag
        linkProps={{
          href: "#",
          onClick: () => modal.open(),
          className: cx("fr-tag--custom-alt-contraindication"),
        }}
      >
        <span className={["fr-icon--custom-pregnancy" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")}>
          <span className={"fr-mr-1w"}>Mention contre-indication grossesse</span>
        </span>
      </Tag>
    </>
  );
}

export default PregnancyCISTag;
