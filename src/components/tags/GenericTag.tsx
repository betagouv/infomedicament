import Tag from "@codegouvfr/react-dsfr/Tag";
import React from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import Link from "next/link";

export default function GenericTag(props: { specGeneId: string }) {
  return (
    <div style={{display: "inline"}}>
      <Tag
        iconId="fr-icon-capsule-fill"
        linkProps={{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${props.specGeneId}`,
        }}
      >
        Générique
      </Tag>{" "}
      <div className={cx("fr-hidden-md")}>
        <Link href={`/generiques/${props.specGeneId}`} className={cx("fr-link", "fr-link--sm")}>
          Voir le groupe générique
        </Link>
      </div>
      <div className={cx("fr-hidden", "fr-unhidden-md")}>
        <Link href={`/generiques/${props.specGeneId}`} className={cx("fr-link", "fr-link--sm")} style={{whiteSpace: "nowrap"}}>
          Voir alternatives
        </Link>
      </div>
    </div>
  );
}
