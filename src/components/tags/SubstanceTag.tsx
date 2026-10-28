"use client";

import type { CompositionComponent } from "@/types/SubstanceTypes";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { displaySimpleComposants } from "@/displayUtils";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { HTMLAttributes } from "react";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";
import { getSubstanceSlug } from "@/utils/substances";

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
        href: `/substances/${getSubstanceSlug(displaySimpleComposants(composants))}`,
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
