import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import Link from "next/link";

export default function PrincepsTag(props: { CIS: string }) {
  return (
    <div>
      <Tag
        iconId="fr-icon-capsule-fill"
        linkProps={{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${props.CIS}`,
        target: "_blank",
        }}
      >
        Voir les Princeps
      </Tag>
    </div>
  );
}
