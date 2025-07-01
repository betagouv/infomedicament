import Tag from "@codegouvfr/react-dsfr/Tag";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { fr } from "@codegouvfr/react-dsfr";
import "./dsfr-custom-tags.css";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Link from "next/link";

const modal = createModal({
  id: "pregnancy-subs-modal", 
  isOpenedByDefault: false
});

export default function PregnancySubsTag() {

  return (
    <>
      <modal.Component title="">
        <h4 className={"fr-icon--custom-pregnancy" as FrIconClassName}>Plan de prévention grossesse</h4>
        <span>
          Ce tag signale que ce médicament est concerné par un{" "} 
          <Link 
            href="https://ansm.sante.fr/dossiers-thematiques/medicaments-et-grossesse/les-programmes-de-prevention-des-grossesses" 
            target="_blank"
            rel="noopener noreferrer"
          >
            plan de prévention grossesse
          </Link>.<br/>
          Il peut présenter des risques pour le fœtus (malformations, effets toxiques).<br/>
          Lisez attentivement la notice et parlez-en à un professionnel de santé avant toute utilisation.
        </span>
      </modal.Component>
      <Tag
        linkProps={{
          href: "#",
          onClick: () => modal.open(),
          className: cx("fr-tag--custom-alt-contraindication"),
        }}
      >
        <span className={["fr-icon--custom-pregnancy" as FrIconClassName, fr.cx("fr-text--sm")].join(" ")}/>
        <span className={fr.cx("fr-ml-1w", "fr-text--sm")}>Plan de prévention grossesse</span>
      </Tag>
    </>
  );
}
