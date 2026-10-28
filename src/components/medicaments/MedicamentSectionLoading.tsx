import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "../generic/ContentContainer";
import { SkeletonLine, SkeletonText } from "../generic/Skeleton";

export function IndicationsLoading() {
  return (
    <ContentContainer
      whiteContainer
      className={fr.cx("fr-mb-2w", "fr-p-2w")}
      role="status"
      aria-label="Chargement des indications"
    >
      <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>À quoi sert-il ?</h2>
      <SkeletonText lines={4} />
    </ContentContainer>
  );
}

export function DetailsLoading() {
  return (
    <div role="status" aria-label="Chargement des détails">
      <ContentContainer whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
        <div className={fr.cx("fr-mb-2w")}>
          <SkeletonLine width="65%" height="1.75rem" borderRadius="1rem" />
        </div>
        <SkeletonText lines={5} />
      </ContentContainer>
      <ContentContainer whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
        <h2 className={fr.cx("fr-h6")}>Présentations</h2>
        <SkeletonText lines={4} />
      </ContentContainer>
    </div>
  );
}

export function NoticeTextLoading() {
  return (
    <div role="status" aria-label="Chargement de la notice">
      {[0, 1, 2].map((index) => (
        <div className={fr.cx("fr-mb-4w")} key={index}>
          <div className={fr.cx("fr-mb-2w")}>
            <SkeletonLine height="1.5rem" width={index === 1 ? "55%" : "75%"} />
          </div>
          <SkeletonText lines={index === 1 ? 5 : 4} />
        </div>
      ))}
    </div>
  );
}
