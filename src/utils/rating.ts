// Allowlist: Unicode letters/digits, spaces, and punctuation found in real page labels.
// Blocks shell/SQL/XSS/JNDI metacharacters ($, {, }, |, ;, `, <, >, ", \, #, ^, =, @, ...).
const VALID_PAGE_ID_RE = /^[\p{L}\p{N} \-,.:/()!?'''&%]+$/u;

export function isValidPageId(pageId: unknown): boolean {
  return (
    typeof pageId === "string" &&
    pageId.length > 0 &&
    pageId.length <= 150 &&
    VALID_PAGE_ID_RE.test(pageId) &&
    !pageId.includes("..") &&   // no path traversal
    !pageId.includes("//") &&   // no URLs
    !/[^ ]:/.test(pageId)       // colon must be preceded by a space (blocks javascript:, http:, c:/)
  );
}

