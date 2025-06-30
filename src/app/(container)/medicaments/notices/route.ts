import db from '@/db';
import { Notice, NoticeContentBlock } from '@/types/MedicamentsTypes';
import { NextRequest, NextResponse } from "next/server";


async function getContent(children: number[]): Promise<any[]>{
  const childrenData = await db
    .selectFrom("notices_content")
    .selectAll()
    .where("id", "in", children)
    .execute();
  
  return await Promise.all(
    childrenData.map(async (child) => {
      const data:NoticeContentBlock = {
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

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const CIS = params.get("cis");

  if (!CIS) {
    return NextResponse.json(
      { error: "Missing CIS parameter" },
      { status: 400 },
    );
  }

  const noticeRaw = await db
    .selectFrom("notices")
    .selectAll()
    .where("codeCIS", "=", parseInt(CIS))
    .executeTakeFirst();

  if(!noticeRaw) return NextResponse.json(undefined);

  const notice:Notice = {
    codeCIS: noticeRaw.codeCIS,
    title: noticeRaw.title,
    dateNotif: noticeRaw.dateNotif,
    children: [],
  }
  
  if(noticeRaw.children && noticeRaw.children.length > 0) 
    notice.children = await getContent(noticeRaw.children);

  return NextResponse.json(notice);
};
