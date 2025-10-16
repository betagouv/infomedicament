import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import React from "react";
import "./dsfr-custom-tags.css";
import { ATC } from "@/types/ATCTypes";

export default function ClassTag(props: { atc2: ATC }) {
  return (
    <Tag
      linkProps={{
        href: `/atc/${props.atc2.code}`,
        className: cx("fr-tag--custom-alt-class"),
        target: "_blank",
      }}
    >
      {props.atc2.label}
    </Tag>
  );
}
