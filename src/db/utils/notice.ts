"use server";

import db from '@/db';
import { NoticeData, NoticeRCPContentBlock } from '@/types/SpecialiteTypes';
import { NoticeDB } from '../types';
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

// Returns the plain text of a notice's "indications" section (anchor
// "Ann3bQuestceque"), given the notice's top-level content-block ids.
// Only that subtree is loaded — one query per tree depth — so memory stays
// bounded to a single notice instead of the whole notices_content table.
export async function getIndicationsText(noticeChildrenIds: number[]): Promise<string> {
  if (!noticeChildrenIds || noticeChildrenIds.length === 0) return "";

  const fetchBlocks = (ids: number[]) =>
    db
      .selectFrom("notices_content")
      .select(["id", "anchor", "content", "children"])
      .where("id", "in", ids)
      .execute();

  const topLevel = await fetchBlocks(noticeChildrenIds);
  const indicationsBlock = topLevel.find((b) => b.anchor === "Ann3bQuestceque");
  if (!indicationsBlock?.children || indicationsBlock.children.length === 0) return "";

  // Load the whole indications subtree, one depth level per query.
  const byId = new Map<number, { content?: string[]; children?: number[] }>();
  let frontier = indicationsBlock.children;
  while (frontier.length > 0) {
    const rows = await fetchBlocks(frontier);
    const next: number[] = [];
    for (const row of rows) {
      if (row.id == null) continue;
      byId.set(row.id, { content: row.content, children: row.children });
      if (row.children && row.children.length > 0) next.push(...row.children);
    }
    frontier = next;
  }

  // Depth-first text assembly: a block's own content, then its descendants.
  const assemble = (ids: number[]): string => {
    let desc = "";
    ids.forEach((id) => {
      const block = byId.get(id);
      if (!block) return;
      if (block.content && block.content.length > 0) {
        desc += (desc !== "" ? " " : "") + block.content.join(" ");
      }
      if (block.children && block.children.length > 0) {
        const childText = assemble(block.children);
        if (childText) desc += (desc !== "" ? " " : "") + childText;
      }
    });
    return desc;
  };

  return assemble(indicationsBlock.children);
};
