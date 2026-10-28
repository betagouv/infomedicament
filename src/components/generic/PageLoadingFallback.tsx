"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "./ContentContainer";
import styled from "styled-components";
import { SkeletonLine } from "./Skeleton";

const LoadingStatus = styled.div`
  margin-block: 2rem;
  margin-inline: auto;
  max-width: 48rem;
`;

const LoadingLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HeadingSkeleton = styled(SkeletonLine)`
  margin-bottom: 0.75rem;
`;

export default function PageLoadingFallback({
  contained = false,
}: {
  contained?: boolean;
}) {
  return (
    <ContentContainer frContainer={!contained}>
      <LoadingStatus role="status" aria-live="polite">
        <span className={fr.cx("fr-sr-only")}>Chargement de la page…</span>
        <LoadingLines aria-hidden="true">
          <HeadingSkeleton width="55%" height="1.75rem" />
          <SkeletonLine />
          <SkeletonLine width="92%" />
          <SkeletonLine />
          <SkeletonLine width="68%" />
        </LoadingLines>
      </LoadingStatus>
    </ContentContainer>
  );
}
