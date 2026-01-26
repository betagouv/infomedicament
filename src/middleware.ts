import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/utils/rate-limit";

// Rate limit: 100 requests per minute per IP
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

export function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Skip static assets
    if (
        url.pathname.startsWith("/_next") ||
        url.pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown-ip";
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
