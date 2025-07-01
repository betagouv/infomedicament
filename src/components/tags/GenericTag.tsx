import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import Link from "next/link";

export default function GenericTag(
  props: { 
    specGeneId: string,
    hideIcon?: boolean
  }
) {
  return (
    <div>
      <Tag
        iconId={!props.hideIcon ? "fr-icon-capsule-fill" : undefined}
        linkProps={{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${props.specGeneId}`,
        }}
      >
        Générique
      </Tag>{" "}
      <div style={{display: "inline"}}>
        <Link href={`/generiques/${props.specGeneId}`} className={cx("fr-link", "fr-link--sm")}>
          <span className={cx("fr-hidden-md")}>Voir le groupe générique</span>
          <span className={cx("fr-hidden", "fr-unhidden-md")} style={{whiteSpace: "nowrap"}}>Voir alternatives</span>
        </Link>
      </div>
    </div>
  );
}
