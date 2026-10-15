import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import { ReactNode } from "react";

export default function SearchPage({
  searchInput,
  children,
}: {
  searchInput: ReactNode;
  children: ReactNode;
}) {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div
          className={fr.cx(
            "fr-col-12",
            "fr-col-lg-9",
            "fr-col-md-10",
            "fr-mt-4w",
            "fr-mb-2w",
          )}
        >
          {searchInput}
        </div>
      </div>
      {children}
    </ContentContainer>
  );
}
