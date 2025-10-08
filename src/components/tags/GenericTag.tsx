import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import Link from "next/link";

export default function GenericTag(
  props: { 
    specGeneId: string,
    hideIcon?: boolean
  }
) {
  return (
    <div>
      <Tag
        iconId={!props.hideIcon ? "fr-icon-capsule-fill" : undefined}
        linkProps={{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${props.specGeneId}`,
          target: "_blank",
        }}
      >
        Voir les Génériques
      </Tag>{" "}
    </div>
  );
}
