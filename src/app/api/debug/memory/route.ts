import { NextResponse } from "next/server";

// Don't allow calls to this API in production
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const url = new URL(request.url);

  // This will let us ask for a forced-garbage collection before returning the values
  const gc = url.searchParams.get("gc") === "true";

  // Force garbage collection if requested and available
  if (gc && global.gc) {
    global.gc();
  }

  const memUsage = process.memoryUsage();
  const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

  // Get V8 heap statistics if available
  let heapStats = null;
  try {
    const v8 = require("v8");
    heapStats = v8.getHeapStatistics();
  } catch { }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(0) + "s",
    gcAvailable: typeof global.gc === "function",
    gcTriggered: gc && typeof global.gc === "function",
    memory: {
      heapUsed: formatMB(memUsage.heapUsed),
      heapTotal: formatMB(memUsage.heapTotal),
      rss: formatMB(memUsage.rss),
      external: formatMB(memUsage.external),
      arrayBuffers: formatMB(memUsage.arrayBuffers),
    },
    heapStats: heapStats ? {
      totalHeapSize: formatMB(heapStats.total_heap_size),
      usedHeapSize: formatMB(heapStats.used_heap_size),
      heapSizeLimit: formatMB(heapStats.heap_size_limit),
      mallocedMemory: formatMB(heapStats.malloced_memory),
      numberOfNativeContexts: heapStats.number_of_native_contexts,
      numberOfDetachedContexts: heapStats.number_of_detached_contexts,
    } : null,
    raw: memUsage,
  });
}
