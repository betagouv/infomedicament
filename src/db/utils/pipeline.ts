"use server";

import "server-only";
import { unstable_cache } from "next/cache";
import db from "@/db";

export const getLastSuccessfulPipelineRunDate = unstable_cache(
  async function (): Promise<string | null> {
    const result = await db
      .selectFrom("pipeline_run")
      .where("status", "=", "success")
      .select((eb) => eb.fn.max("finished_at").as("lastUpdated"))
      .executeTakeFirst();

    return result?.lastUpdated?.toISOString() ?? null;
  },
  ["last-successful-pipeline-run-date"],
  { revalidate: 3600 },
);
