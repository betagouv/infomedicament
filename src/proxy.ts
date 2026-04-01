import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/utils/rate-limit";

// Rate limit: 200 requests per minute per IP
const RATE_LIMIT = 200; // TODO: we shouldn't need such a high limit
const RATE_WINDOW_MS = 60_000;

export function proxy(req: NextRequest) {
    const url = req.nextUrl;

    // Skip static assets and RSC prefetch requests (Next.js 16 fires significantly
    // more prefetch requests than v15 — counting them inflates the rate limit)
    if (
        url.pathname.startsWith("/_next") ||
        url.pathname.includes(".") ||
        req.headers.get("next-router-prefetch")
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
