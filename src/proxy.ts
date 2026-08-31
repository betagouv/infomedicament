import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isRateLimited } from "@/utils/rate-limit";

// Rate limit: 200 req/min per IP and per container
const RATE_LIMIT = 200;
const RATE_WINDOW_MS = 60_000;

function requestId(req: NextRequest) {
    const incomingRequestId = req.headers.get("x-request-id");

    if (incomingRequestId && /^[A-Za-z0-9._:-]{1,128}$/.test(incomingRequestId)) {
        return incomingRequestId;
    }

    return crypto.randomUUID();
}

function nextResponse(req: NextRequest, id: string) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-request-id", id);

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", id);
    return response;
}

function logRequest(
    req: NextRequest,
    id: string,
    outcome: "forwarded" | "bypassed" | "rate_limited",
    statusCode?: number,
) {
    const fields = {
        event: "http.request",
        request_id: id,
        method: req.method,
        path: req.nextUrl.pathname,
        outcome,
        ...(statusCode ? { status_code: statusCode } : {}),
    };

    if (outcome === "rate_limited") {
        logger.warn(fields, "Request rate limited");
    } else {
        logger.info(fields, "Request received");
    }
}

export function proxy(req: NextRequest) {
    const url = req.nextUrl;
    const id = requestId(req);

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
        logRequest(req, id, "bypassed");
        return nextResponse(req, id);
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown-ip";

    if (url.pathname === "/rating") {
        const { limited } = isRateLimited(`${ip}:rating`, 4, RATE_WINDOW_MS);
        if (limited) {
            const response = new NextResponse("Too Many Requests", {
                status: 429,
                headers: { "Retry-After": "60", "x-request-id": id },
            });
            logRequest(req, id, "rate_limited", response.status);
            return response;
        }
    }

    const { limited, remaining } = isRateLimited(ip, RATE_LIMIT, RATE_WINDOW_MS);

    if (limited) {
        const response = new NextResponse("Too Many Requests", {
            status: 429,
            headers: { "Retry-After": "60", "x-request-id": id },
        });
        logRequest(req, id, "rate_limited", response.status);
        return response;
    }

    const response = nextResponse(req, id);
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    logRequest(req, id, "forwarded");
    return response;
}
