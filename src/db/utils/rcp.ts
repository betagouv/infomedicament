"use server";

import db from '@/db';
import { Rcp, NoticeRCPContentBlock } from '@/types/MedicamentTypes';

async function getContent(children: number[]): Promise<any[]>{
  const childrenData = await db
    .selectFrom("rcp_content")
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

export async function getRCP(CIS: string): Promise<Rcp | undefined> {
  const rcpRaw = await db
    .selectFrom("rcp")
    .selectAll()
    .where("codeCIS", "=", parseInt(CIS))
    .executeTakeFirst();

  if(!rcpRaw) return undefined;

  const rcp:Rcp = {
    codeCIS: rcpRaw.codeCIS,
    title: rcpRaw.title,
    dateNotif: rcpRaw.dateNotif,
    children: [],
  }
  
  if(rcpRaw.children && rcpRaw.children.length > 0) 
    rcp.children = await getContent(rcpRaw.children);

  return rcp;
};
