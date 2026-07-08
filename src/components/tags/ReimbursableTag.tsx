"use client";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";

interface ReimbursableTagProps extends HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
  className?: string;
}

function ReimbursableTag({ 
  hideIcon,
  className
}: ReimbursableTagProps) {

  return (
    <Tag
      iconId={!hideIcon ? "fr-icon-money-euro-circle-fill" : undefined}
      nativeButtonProps={{
        className: [cx("fr-tag--custom-alt-blue"), className].join(" "),
      }}
    >
      Remboursable
    </Tag>
  );
}

export default ReimbursableTag;
