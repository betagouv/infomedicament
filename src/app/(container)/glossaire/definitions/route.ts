import getGlossaryDefinitions from '@/data/grist/glossary';
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {

  const definitions = (await getGlossaryDefinitions()).filter(
    (d) => d.fields.A_publier,
  );

  return NextResponse.json(definitions);

};
