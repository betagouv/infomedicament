import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";

export default function PrescriptionTag() {
  return (
    <Tag
      small
      iconId="fr-icon-file-text-fill"
      nativeButtonProps={{
        className: cx("fr-tag--custom-alt-blue"),
      }}
    >
      Sur ordonnance
    </Tag>
  );
}
