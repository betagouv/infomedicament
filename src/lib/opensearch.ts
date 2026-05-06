import "server-only";

export function getOSConfig(): { baseUrl: string; authHeader: string | undefined } {
  const raw =
    process.env.SCALINGO_OPENSEARCH_URL ??
    process.env.OPENSEARCH_URL ??
    "http://opensearch:9200";
  const url = new URL(raw);
  const authHeader =
    url.username && url.password
      ? "Basic " +
        Buffer.from(
          `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`,
        ).toString("base64")
      : undefined;
  url.username = "";
  url.password = "";
  return { baseUrl: url.toString().replace(/\/$/, ""), authHeader };
}

export function osHeaders(authHeader?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;
  return headers;
}
