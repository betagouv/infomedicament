"use server";

import db from '@/db';
import { NoticeData } from '@/types/SpecialiteTypes';
import { NoticeDB } from '../types';
import { formatNoticeDateNotif } from '@/utils/notices';

export async function getNotice(CIS: string): Promise<NoticeData | undefined> {
  const noticeRaw = await db
    .selectFrom("notices")
    .selectAll()
    .where("codeCIS", "=", parseInt(CIS))
    .executeTakeFirst();

  if(!noticeRaw) return undefined;

  return {
    codeCIS: noticeRaw.codeCIS,
    title: noticeRaw.title,
    dateNotif: formatNoticeDateNotif(noticeRaw.dateNotif),
    contentHtml: noticeRaw.content_html ?? "",
  };
};

export async function getNoticesByCIS(
  CISList: number[],
): Promise<Pick<NoticeDB, "codeCIS" | "content_html">[]> {
  return await db
    .selectFrom("notices")
    .select(["codeCIS", "content_html"])
    .where("codeCIS", "in", CISList)
    .execute();
};
