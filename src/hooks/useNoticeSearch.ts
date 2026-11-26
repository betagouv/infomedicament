"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NoticeSearchResponse } from "@/types/NoticeSearch";

export function useNoticeSearch(slug?: string) {
  const [result, setResult] = useState<NoticeSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  const cancel = useCallback(() => {
    sequence.current += 1;
    request.current?.abort();
    request.current = null;
  }, []);

  useEffect(() => {
    cancel();
    setResult(null);
    setLoading(false);
    return cancel;
  }, [slug, cancel]);

  const close = useCallback(() => {
    cancel();
    setResult(null);
    setLoading(false);
  }, [cancel]);

  const search = useCallback(
    async (questionId: string) => {
      cancel();
      if (!slug) return;
      const controller = new AbortController();
      const id = sequence.current;
      request.current = controller;
      setResult(null);
      setLoading(true);
      try {
        const response = await fetch(
          `/medicaments/${slug}/notice-search?question=${encodeURIComponent(questionId)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("Notice search failed");
        const body = (await response.json()) as NoticeSearchResponse;
        if (
          !["supported", "insufficient_evidence", "unavailable"].includes(
            body.status,
          ) ||
          !Array.isArray(body.passages)
        ) {
          throw new Error("Invalid notice search response");
        }
        if (sequence.current === id) setResult(body);
      } catch {
        if (sequence.current === id)
          setResult({ status: "error", passages: [] });
      } finally {
        if (sequence.current === id) {
          request.current = null;
          setLoading(false);
        }
      }
    },
    [slug, cancel],
  );

  return { result, loading, search, close };
}
