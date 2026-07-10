"use client";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";

interface HospitalTagProps extends HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
  className?: string;
}

function HospitalTag({ 
  hideIcon,
  className
}: HospitalTagProps) {

  return (
    <Tag
      iconId={!hideIcon ? "fr-icon-hospital-fill" : undefined}
      nativeButtonProps={{
        className: [cx("fr-tag--custom-alt-blue"), className].join(" "),
      }}
    >
      Usage hospitalier
    </Tag>
  );
}

export default HospitalTag;
