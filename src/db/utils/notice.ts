"use server";

import db from '@/db';
import { NoticeData, NoticeRCPContentBlock } from '@/types/SpecialiteTypes';
import { NoticeContentDB, NoticeDB } from '../types';
import { formatNoticeDateNotif } from '@/utils/notices';

async function getContent(children: number[]): Promise<any[]>{
  const childrenData = await db
    .selectFrom("notices_content")
    .selectAll()
    .where("id", "in", children)
    .execute();
  
  return await Promise.all(
    childrenData.map(async (child) => {
      const data:NoticeRCPContentBlock = {
        id: child.id,
        type: child.type,
        styles: child.styles,
        anchor: child.anchor,
        content: child.content,
        children: [],
        tag: child.tag,
        rowspan: child.rowspan,
        colspan: child.colspan,
      }
      if(child.children && child.children.length > 0) {
        data.children = await getContent(child.children);
      }
      return data;
    })
  );
}

export async function getNotice(CIS: string): Promise<NoticeData | undefined> {
  const notice:NoticeData = {
    codeCIS: parseInt(CIS),
    title: "",
    dateNotif: "",
    children: [],
  }

  const noticeRaw = await db
    .selectFrom("notices")
    .selectAll()
    .where("codeCIS", "=", parseInt(CIS))
    .executeTakeFirst();

  if(!noticeRaw) return undefined;

  notice.title = noticeRaw.title;
  notice.dateNotif = formatNoticeDateNotif(noticeRaw.dateNotif);
  
  if(noticeRaw.children && noticeRaw.children.length > 0) 
    notice.children = await getContent(noticeRaw.children);

  return notice;
};

export async function getAllNoticesWithoutChildren(): Promise<NoticeDB[]> {
  return await db
    .selectFrom("notices")
    .selectAll()
    .execute();
};

export async function getAllNoticesContent(): Promise<NoticeContentDB[]> {
  return await db
    .selectFrom("notices_content")
    .selectAll()
    .execute();
};
