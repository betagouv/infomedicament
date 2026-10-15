"use client";

import type { CSSProperties } from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  to { transform: translateX(100%); }
`;

const Line = styled.span`
  display: block;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  width: 100%;
  height: 1rem;
  border-radius: 0.25rem;
  background: var(--background-contrast-grey, #eee);

  &::after {
    position: absolute;
    inset: 0;
    content: "";
    background: linear-gradient(
      90deg,
      transparent,
      var(--background-default-grey, #fff),
      transparent
    );
    transform: translateX(-100%);
    animation: ${shimmer} 1.8s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`;

const Text = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

type SkeletonLineProps = {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  borderRadius?: CSSProperties["borderRadius"];
  className?: string;
};

export function SkeletonLine({
  width,
  height,
  borderRadius,
  className,
}: SkeletonLineProps) {
  return (
    <Line
      aria-hidden="true"
      className={className}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <Text aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonLine
          key={index}
          width={index === lines - 1 ? "68%" : index % 2 ? "94%" : "100%"}
        />
      ))}
    </Text>
  );
}
