export function getOSConfig(): { baseUrl: string; authHeader: string | null } {
  const raw =
    process.env.SCALINGO_OPENSEARCH_URL ||
    process.env.OPENSEARCH_URL ||
    "http://localhost:9200";
  const url = new URL(raw);
  let authHeader: string | null = null;
  if (url.username || url.password) {
    const encoded = Buffer.from(
      `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`,
    ).toString("base64");
    authHeader = `Basic ${encoded}`;
    url.username = "";
    url.password = "";
  }
  return { baseUrl: url.toString().replace(/\/$/, ""), authHeader };
}

export function osHeaders(authHeader: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) headers["Authorization"] = authHeader;
  return headers;
}
