import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";

interface PrescriptionTagProps extends HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
}

function PrescriptionTag({ 
  hideIcon,
}: PrescriptionTagProps) {

  return (
    <Tag
      iconId={!hideIcon ? "fr-icon-file-text-fill" : undefined}
      nativeButtonProps={{
        className: cx("fr-tag--custom-alt-blue"),
      }}
    >
      Sur ordonnance
    </Tag>
  );
}

export default PrescriptionTag;
