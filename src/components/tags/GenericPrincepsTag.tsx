import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";
import Link from "next/link";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import styled from 'styled-components';

type GenericPrinceps = "generic" | "princeps";

const modal = createModal({
  id: "generic-princeps-modal", 
  isOpenedByDefault: false
});

const ModalContent = styled.div`
  h4::before {
    margin-right: 0.4rem;
  }
`;

interface GenericPrincepsTagProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
  type: GenericPrinceps;
  hideIcon?: boolean;
  fromMedicament?: boolean;
}

function GenericPrincepsTag({ 
  id,
  type,
  hideIcon,
  fromMedicament,
  ...props
} : GenericPrincepsTagProps) {

  const onTrackEvent = () => {
    const action: string = type === "generic" ? "Tag Generic" : "Tag Princeps";
    if(fromMedicament)
      trackEvent("Page médicament", action);
  };

  return (
    <div {...props}>
      <modal.Component title="">
        <ModalContent>
          <h4>Princeps et générique, qu’est-ce que c’est ?</h4>
          <p>
            Un médicament <b>générique</b> est fabriqué à partir de la même molécule
            qu&apos;un médicament déjà autorisé, dit médicament de référence ou{" "}
            <b>princeps</b>. Le générique contient strictement la même quantité de
            la même substance active que son princeps et est équivalent sur le plan
            médical.
          </p>
          <p>
            Le médicament de référence et les médicaments qui en sont génériques
            constituent un <b>groupe générique</b>.
          </p>
          <p>
            Sauf sur recommandation spécifique d&apos;un médecin, un médicament
            générique peut être substitué par votre pharmacien·ne à un médicament de
            référence.
          </p>
        </ModalContent>
      </modal.Component>
      <Tag
        iconId={!hideIcon ? "fr-icon-capsule-fill" : undefined}
        nativeButtonProps= {{
          className: cx("fr-tag--custom-alt-blue"),
        }}
        onClick={() => modal.open()}
      >
        {type === "generic" ? "Générique" : "Princeps"}
      </Tag>
      <div style={{display: "inline"}}>
        <Link
          href={`/generiques/${id}`}
          className={cx("fr-text--sm", "fr-link", "fr-ml-0-5v")}
          onClick={() => onTrackEvent()}
          style={{whiteSpace: "nowrap"}}
        >
          Voir les alternatives
        </Link>
      </div>
    </div>
  );
}

export default GenericPrincepsTag;
