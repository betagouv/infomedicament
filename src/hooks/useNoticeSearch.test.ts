import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNoticeSearch } from "./useNoticeSearch";

const fetchMock = vi.fn();
function deferredResponse() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve: (status: string) => resolve(new Response(JSON.stringify({ status, passages: [] }))) };
}
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe("notice search requests", () => {
  it("ignores a previous response even when the server ignores cancellation", async () => {
    const first = deferredResponse();
    const second = deferredResponse();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useNoticeSearch("test-123"));
    let firstRequest!: Promise<void>;
    let secondRequest!: Promise<void>;
    act(() => { firstRequest = result.current.search("ancienne question"); });
    act(() => { secondRequest = result.current.search("nouvelle question"); });
    await act(async () => { second.resolve("insufficient_evidence"); await secondRequest; });
    await act(async () => { first.resolve("unavailable"); await firstRequest; });
    expect(result.current.result?.status).toBe("insufficient_evidence");
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it.each(["close", "navigateToSection"] as const)("does not reopen results after %s", async (action) => {
    const pending = deferredResponse();
    fetchMock.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useNoticeSearch("test-123"));
    let request!: Promise<void>;
    act(() => { request = result.current.search("question"); });
    act(() => { result.current[action]("taking"); });
    await act(async () => { pending.resolve("unavailable"); await request; });
    expect(result.current.result?.status ?? null).toBe(action === "close" ? null : "section");
    expect(result.current.loading).toBe(false);
  });

  it("reports failed requests and clears results when the medicine changes", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    const { result, rerender } = renderHook(({ slug }) => useNoticeSearch(slug), { initialProps: { slug: "first-123" } });
    await act(async () => result.current.search("question"));
    expect(result.current.result?.status).toBe("error");
    rerender({ slug: "second-456" });
    expect(result.current.result).toBeNull();
  });
});
