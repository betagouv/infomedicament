"use client";

import { fr } from "@codegouvfr/react-dsfr";
import type { HTMLAttributes, PropsWithChildren } from "react";
import styled, { css } from "styled-components";

const Container = styled.div<{
  $whiteContainer?: boolean;
  $mobileOverflowX?: boolean;
}>`
  ${({ $whiteContainer }) =>
    $whiteContainer &&
    css`
      background-color: var(--background-default-grey);
      border: 1px solid var(--border-open-blue-france);
      border-radius: 8px;
    `}
  ${({ $mobileOverflowX }) =>
    $mobileOverflowX &&
    css`
      @media (max-width: 48em) {
        overflow-x: auto;
      }
    `}
`;

interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  frContainer?: boolean;
  whiteContainer?: boolean;
  mobileOverflowX?: boolean;
}

export default function ContentContainer({
  frContainer,
  whiteContainer,
  mobileOverflowX,
  children,
  className,
  ...props
}: PropsWithChildren<ContentContainerProps>) {
  return (
    <Container
      {...props}
      $whiteContainer={whiteContainer}
      $mobileOverflowX={mobileOverflowX}
      className={[
        frContainer ? fr.cx("fr-container", "fr-pt-1w", "fr-pb-2w") : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Container>
  );
}
