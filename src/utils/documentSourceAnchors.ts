/** Stable fragment for source blocks without a unique legacy anchor. */
export function getDocumentBlockAnchor(blockId: string): string {
  return `notice-block-${blockId}`;
}
