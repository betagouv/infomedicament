// Base URL of the site, without trailing slash, for the absolute URLs (sitemap, structured data)
// Never localhost URLs in production
export function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) return baseUrl.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_BASE_URL must be set in production (absolute URLs)",
    );
  }
  return "http://localhost:3000";
}
