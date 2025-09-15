import db from '@/db';
import { Notice, NoticeRCPContentBlock } from '@/types/MedicamentTypes';
import { NextRequest, NextResponse } from "next/server";


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
        html: child.html,
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

  const notice:Notice = {
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

  if(!noticeRaw) return NextResponse.json(notice);

  notice.title = noticeRaw.title;
  notice.dateNotif = noticeRaw.dateNotif;
  
  if(noticeRaw.children && noticeRaw.children.length > 0) 
    notice.children = await getContent(noticeRaw.children);

  return NextResponse.json(notice);
};
