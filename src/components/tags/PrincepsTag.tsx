import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";

interface PrincepsTagProps extends HTMLAttributes<HTMLDivElement> {
  CIS: string;
  hideIcon?: boolean;
  withLink?: boolean;
  fromMedicament?: boolean;
}

export default function PrincepsTag({ 
  CIS,
  hideIcon,
  withLink,
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
        {...(withLink ? {linkProps:{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${CIS}`,
          target: "_blank",
          onClick: () => onTrackEvent(),
        }} : {
          nativeButtonProps: {
            className: cx("fr-tag--custom-alt-blue"),
          }
        })}
      >
        {withLink ? (
          <span>Voir les Princeps</span>
        ) : (
          <span>Princeps</span>
        )}
      </Tag>
    </div>
  );
}
