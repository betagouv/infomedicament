/** Stable fragment for source blocks without a unique legacy anchor. */
export function getDocumentBlockAnchor(blockId: string): string {
  return `notice-block-${blockId}`;
}

export const documentSourceSelector = "p, li, table, ol, ul";

/** Fallback for legacy source blocks without a database block identifier. */
export function getDocumentSourceAnchor(index: number): string {
  return `notice-source-${index}`;
}
