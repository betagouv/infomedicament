"use client";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { HTMLAttributes } from "react";
import "./dsfr-custom-tags.css";
import { ATC } from "@/types/ATCTypes";
import { trackEvent } from "@/services/tracking";
import { getAtcSlug } from "@/utils/atc";

interface ClassTagProps extends HTMLAttributes<HTMLDivElement> {
  atc2: ATC;
  fromMedicament?: boolean;
}

function ClassTag({ atc2, fromMedicament }: ClassTagProps) {
  const onTrackEvent = () => {
    if (fromMedicament) trackEvent("Page médicament", "Tag Classe ATC2");
  };

  return (
    <Tag
      linkProps={{
        href: `/atc/${getAtcSlug(atc2.code, atc2.label)}`,
        className: cx("fr-tag--custom-alt-class"),
        target: "_blank",
        onClick: () => onTrackEvent(),
      }}
    >
      {atc2.label}
    </Tag>
  );
}

export default ClassTag;
