import Tag from "@codegouvfr/react-dsfr/Tag";
import type { FrIconClassName } from "@codegouvfr/react-dsfr/src/fr/generatedFromCss/classNames";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";

export default function PregnancyTag() {
  return (
    <Tag
      small
      iconId={"fr-icon--custom-pregnancy" as FrIconClassName}
      linkProps={{
        href: "#",
        className: cx("fr-tag--custom-alt-contraindication"),
      }}
    >
      Contre-indication grossesse
    </Tag>
  );
}
