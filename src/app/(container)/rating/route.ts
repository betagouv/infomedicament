import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { SimpleRating } from "@/types/RatingTypes";

export async function POST(req: NextRequest) {
  const data: SimpleRating = await req.json();
  const rawId = await db.insertInto("rating")
    .values(data)
    .returning('id')
    .executeTakeFirst();

  const id: number = (rawId && rawId.id !== undefined) ? rawId.id : -1;
  return NextResponse.json(id);
};

export async function PATCH(req: NextRequest) {
  const data = await req.json();
  const result = await db.updateTable("rating")
    .set(data.advancedRating)
    .where('id', "=", data.id)
    .executeTakeFirst();

  const success: boolean = result.numUpdatedRows > 0 ? true : false;
  return NextResponse.json(success);
};
