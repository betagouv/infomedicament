import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";

interface PrincepsTagProps extends HTMLAttributes<HTMLDivElement> {
  CIS: string;
  fromMedicament?: boolean;
}

export default function PrincepsTag({ 
  CIS,
  fromMedicament,
 }: PrincepsTagProps) {

  const onTrackEvent = () => {
    if(fromMedicament)
      trackEvent("Page médicament", "Tag Princeps");
  };

  return (
    <div>
      <Tag
        iconId="fr-icon-capsule-fill"
        linkProps={{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${CIS}`,
          target: "_blank",
          onClick: () => onTrackEvent(),
        }}
      >
        Voir les Princeps
      </Tag>
    </div>
  );
}
