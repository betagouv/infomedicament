import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/utils/rate-limit";

// Rate limit: 200 req/min per IP and per container
const RATE_LIMIT = 200;
const RATE_WINDOW_MS = 60_000;

export function proxy(req: NextRequest) {
    const url = req.nextUrl;

    // Skip static assets and all fetch() requests (Sec-Fetch-Dest: empty).
    // Next.js intentionally strips RSC headers (rsc, next-router-prefetch) from
    // middleware, and rewrites strip ?_rsc= query params — so those signals are
    // unreliable. Sec-Fetch-Dest is browser-set and survives both. RSC navigation
    // and prefetch requests are fetch() calls (empty), while actual HTML page loads
    // are navigations (document). See: github.com/vercel/next.js/issues/65787
    if (
        url.pathname.startsWith("/_next") ||
        url.pathname.includes(".") ||
        req.headers.get("sec-fetch-dest") === "empty"
    ) {
        return NextResponse.next();
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown-ip";

    if (url.pathname === "/rating") {
        const { limited } = isRateLimited(`${ip}:rating`, 4, RATE_WINDOW_MS);
        if (limited) {
            return new NextResponse("Too Many Requests", {
                status: 429,
                headers: { "Retry-After": "60" },
            });
        }
    }

    const { limited, remaining } = isRateLimited(ip, RATE_LIMIT, RATE_WINDOW_MS);

    if (limited) {
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: { "Retry-After": "60" },
        });
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
}
