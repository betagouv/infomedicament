import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";
import Link from "next/link";

interface GenericTagProps extends HTMLAttributes<HTMLDivElement> {
  specGeneId: string;
  hideIcon?: boolean;
  fromMedicament?: boolean;
}

function GenericTag({ 
  specGeneId,
  hideIcon,
  fromMedicament,
  ...props
} : GenericTagProps) {

  const onTrackEvent = () => {
    if(fromMedicament)
      trackEvent("Page médicament", "Tag Generic");
  };

  return (
    <div {...props}>
      <Tag
        iconId={!hideIcon ? "fr-icon-capsule-fill" : undefined}
        nativeButtonProps= {{
          className: cx("fr-tag--custom-alt-blue"),
        }}
      >
        Générique
      </Tag>
      <Link
        href={`/generiques/${specGeneId}`}
        className={cx("fr-text--sm", "fr-link", "fr-ml-0-5v")}
        onClick={() => onTrackEvent()}
        style={{whiteSpace: "nowrap"}}
      >
        Voir les alternatives
      </Link>
    </div>
  );
}

export default GenericTag;
