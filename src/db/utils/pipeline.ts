"use server";

import "server-only";
import { cacheLife } from "next/cache";
import db from "@/db";

export async function getLastSuccessfulPipelineRunDate(): Promise<string | null> {
  "use cache: remote";

  const result = await db
    .selectFrom("pipeline_run")
    .where("status", "=", "success")
    .select((eb) => eb.fn.max("finished_at").as("lastUpdated"))
    .executeTakeFirst();

  return result?.lastUpdated?.toISOString() ?? null;
}
