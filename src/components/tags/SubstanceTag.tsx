import { SpecComposant, SubstanceNom } from "@/db/pdbmMySQL/types";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { displaySimpleComposants } from "@/displayUtils";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import React from "react";
import "./dsfr-custom-tags.css";

export default function SubstanceTag(props: {
  composants: Array<SpecComposant & SubstanceNom>;
}) {
  return (
    <Tag
      small
      linkProps={{
        href: `/substances/${displaySimpleComposants(props.composants)
          .map((s) => s.NomId.trim())
          .join(",")}`,
        className: cx("fr-tag--custom-alt-substance"),
      }}
    >
      {displaySimpleComposants(props.composants)
        .map((s) => s.NomLib.trim())
        .join(", ")}
    </Tag>
  );
}
