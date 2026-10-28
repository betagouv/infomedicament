import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "../generic/ContentContainer";
import { SkeletonLine } from "../generic/Skeleton";
import MedicamentContentLoading from "./MedicamentContentLoading";

export default function MedicamentPageLoading() {
  return (
    <>
      <ContentContainer frContainer>
        <div
          className={fr.cx("fr-my-2w")}
          role="status"
          aria-label="Chargement du médicament"
        >
          <SkeletonLine width="min(28rem, 80%)" height="0.75rem" />
        </div>
        <div className={fr.cx("fr-hidden-md", "fr-my-3w")}>
          <SkeletonLine height="2rem" width="85%" />
        </div>
      </ContentContainer>
      <ContentContainer
        className={fr.cx("fr-pt-1w", "fr-pb-2w")}
        style={{ backgroundColor: "var(--background-alt-grey)" }}
      >
        <MedicamentContentLoading />
      </ContentContainer>
    </>
  );
}
