import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

const responseHeaders = { "Cache-Control": "no-store" };

// Import jobs call this only after committing data and updating derived indexes.
export async function POST(request: Request) {
  const token = process.env.CACHE_INVALIDATION_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Cache invalidation is not configured" },
      { status: 503, headers: responseHeaders },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(authorization), digest(`Bearer ${token}`))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: { ...responseHeaders, "WWW-Authenticate": "Bearer" },
      },
    );
  }

  // Root layout invalidation reaches generated pages and the data caches used
  // by every route, including implicit path tags in the remote Redis handler.
  revalidatePath("/", "layout");

  return NextResponse.json(
    { invalidated: true, scope: "all", regeneration: "on-next-request" },
    { headers: responseHeaders },
  );
}
