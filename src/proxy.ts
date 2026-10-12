import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isRateLimited } from "@/utils/rate-limit";

const DEFAULT_RATE_LIMIT = 200;
const RATE_WINDOW_MS = 60_000;
const STATIC_FETCH_DESTINATIONS = new Set([
    "audio",
    "font",
    "image",
    "manifest",
    "script",
    "style",
    "track",
    "video",
]);
const APPLICATION_ENDPOINT_PATTERNS = [
    /^\/api(?:\/|$)/,
    /^\/interactions\/(?:lookup|search)\/?$/,
    /^\/medicaments\/[^/]+\/notice-search\/?$/,
    /^\/rechercher\/(?:autocomplete|results)\/?$/,
    /^\/statistiques\/matomo\/(?:actions|visits)\/?$/,
];

function rateLimitConfig() {
    const configuredLimit = Number(process.env.RATE_LIMIT);

    return {
        enabled: process.env.RATE_LIMIT_ENABLED?.toLowerCase() !== "false",
        limit: Number.isInteger(configuredLimit) && configuredLimit > 0
            ? configuredLimit
            : DEFAULT_RATE_LIMIT,
    };
}

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
    outcome: "forwarded" | "rate_limited",
    statusCode?: number,
) {
    const endpoint = req.nextUrl.pathname;
    const fields = {
        event: "http.request",
        request_id: id,
        method: req.method,
        path: endpoint,
        outcome,
        ...(statusCode ? { status_code: statusCode } : {}),
    };

    if (outcome === "rate_limited") {
        logger.warn(fields, `Request rate limited: ${endpoint}`);
    } else {
        logger.info(fields, `Request received: ${endpoint}`);
    }
}

function isStaticRequest(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const destination = req.headers.get("sec-fetch-dest");

    return pathname.startsWith("/_next/")
        || /\.[^/]+$/.test(pathname)
        || (destination !== null && STATIC_FETCH_DESTINATIONS.has(destination));
}

function isApplicationEndpoint(pathname: string) {
    return APPLICATION_ENDPOINT_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isBrowserFetch(req: NextRequest) {
    return req.headers.get("sec-fetch-dest") === "empty";
}

function applyRateLimit(
    req: NextRequest,
    id: string,
    identifier: string,
    limit: number,
) {
    const { limited, remaining } = isRateLimited(identifier, limit, RATE_WINDOW_MS);

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

export function proxy(req: NextRequest) {
    const url = req.nextUrl;
    const id = requestId(req);

    // Static assets should be protected and cached at the edge, not counted
    // against the application request quota.
    if (isStaticRequest(req)) {
        return nextResponse(req, id);
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";

    if (url.pathname === "/rating") {
        return applyRateLimit(req, id, `${ip}:rating`, 4);
    }

    const rateLimit = rateLimitConfig();
    if (!rateLimit.enabled) {
        const response = nextResponse(req, id);
        logRequest(req, id, "forwarded");
        return response;
    }

    // Route handlers have their own quota so API activity cannot exhaust the
    // page-navigation quota (or vice versa).
    if (isApplicationEndpoint(url.pathname)) {
        return applyRateLimit(req, id, `${ip}:api`, rateLimit.limit);
    }

    // Next.js App Router navigation and prefetching use fetch() requests for
    // RSC payloads. They are framework transport, not user page visits.
    if (isBrowserFetch(req)) {
        return nextResponse(req, id);
    }

    return applyRateLimit(req, id, `${ip}:page`, rateLimit.limit);
}
