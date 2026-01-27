import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";
import Link from "next/link";

interface PrincepsTagProps extends HTMLAttributes<HTMLDivElement> {
  CIS: string;
  hideIcon?: boolean;
  fromMedicament?: boolean;
}

export default function PrincepsTag({ 
  CIS,
  hideIcon,
  fromMedicament,
  ...props
 }: PrincepsTagProps) {

  const onTrackEvent = () => {
    if(fromMedicament)
      trackEvent("Page médicament", "Tag Princeps");
  };

  return (
    <div {...props}>
      <Tag
        iconId={!hideIcon ? "fr-icon-capsule-fill" : undefined}
        nativeButtonProps= {{
          className: cx("fr-tag--custom-alt-blue"),
        }}
      >
        Princeps
      </Tag>
      <div style={{display: "inline"}}>
        <Link
          href={`/generiques/${CIS}`} 
          className={cx("fr-link", "fr-link--sm", "fr-ml-0-5v")}
          onClick={() => onTrackEvent()}
          style={{whiteSpace: "nowrap"}}
        >
          Voir les alternatives
        </Link>
      </div>
    </div>
  );
}
