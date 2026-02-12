import Tag from "@codegouvfr/react-dsfr/Tag";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { MatchReason } from "@/db/utils/search";
import "./dsfr-custom-tags.css";

const config: Record<string, { prefix: string; className: string }> = {
  pathology: { prefix: "Pathologie : ", className: "fr-tag--custom-alt-blue" },
};

export default function MatchReasonTags({ reasons }: { reasons: MatchReason[] }) {
  // Keep only the first reason per type (the highest-scoring match)
  const seen = new Set<string>();
  const filtered = reasons.filter((r) => {
    if (r.type === "name" || !config[r.type] || seen.has(r.type)) return false;
    seen.add(r.type);
    return true;
  });
  if (filtered.length === 0) return null;

  return (
    <div className={fr.cx("fr-mt-1v")}>
      {filtered.map((reason, i) => (
        <Tag
          key={i}
          small
          nativeButtonProps={{ className: cx(config[reason.type].className) }}
          className={fr.cx("fr-mr-1v")}
        >
          {config[reason.type].prefix}{reason.label}
        </Tag>
      ))}
    </div>
  );
}
