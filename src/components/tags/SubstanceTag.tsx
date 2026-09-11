"use client";

import type { CompositionComponent } from "@/types/SubstanceTypes";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { displaySimpleComposants } from "@/displayUtils";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { HTMLAttributes } from "react";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";

interface SubstanceTagProps extends HTMLAttributes<HTMLDivElement> {
  composants: CompositionComponent[];
  fromMedicament?: boolean;
}

function SubstanceTag({ composants, fromMedicament }: SubstanceTagProps) {
  const onTrackEvent = () => {
    if (fromMedicament) trackEvent("Page médicament", "Tag Substance");
  };

  return (
    <Tag
      linkProps={{
        href: `/substances/${displaySimpleComposants(composants)
          .map((s) => s.NomId.trim())
          .join(",")}`,
        className: cx("fr-tag--custom-alt-substance"),
        target: "_blank",
        onClick: () => onTrackEvent(),
      }}
    >
      {displaySimpleComposants(composants)
        .map((s) => s.NomLib.trim())
        .join(", ")}
    </Tag>
  );
}

export default SubstanceTag;
