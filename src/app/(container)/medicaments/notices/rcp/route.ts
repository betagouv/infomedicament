import db from '@/db';
import { Rcp, RcpContentBlock } from '@/types/MedicamentsTypes';
import { NextRequest, NextResponse } from "next/server";

async function getContent(children: number[]): Promise<any[]>{
  const childrenData = await db
    .selectFrom("rcp_content")
    .selectAll()
    .where("id", "in", children)
    .execute();
  
  return await Promise.all(
    childrenData.map(async (child) => {
      const data:RcpContentBlock = {
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

  const rcpRaw = await db
    .selectFrom("rcp")
    .selectAll()
    .where("codeCIS", "=", parseInt(CIS))
    .executeTakeFirst();

  if(!rcpRaw) return NextResponse.json(undefined);

  const rcp:Rcp = {
    codeCIS: rcpRaw.codeCIS,
    title: rcpRaw.title,
    dateNotif: rcpRaw.dateNotif,
    children: [],
  }
  
  if(rcpRaw.children && rcpRaw.children.length > 0) 
    rcp.children = await getContent(rcpRaw.children);

  return NextResponse.json(rcp);
};
