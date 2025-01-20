import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import React from "react";
import { ATC } from "@/data/grist/atc";
import "./dsfr-custom-tags.css";

export default function ClassTag(props: { atc2: ATC }) {
  return (
    <Tag
      small
      linkProps={{
        href: `/atc/${props.atc2.code}`,
        className: cx("fr-tag--custom-alt-class"),
      }}
    >
      {props.atc2.label}
    </Tag>
  );
}
