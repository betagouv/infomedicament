import { getAutocompleteSuggestions } from "@/db/utils";
import { NextRequest, NextResponse } from "next/server";
import { autocompleteQuerySchema } from "@/schemas/autocomplete";

export async function GET(req: NextRequest) {
  const search = autocompleteQuerySchema.safeParse(req.nextUrl.searchParams.get("s") ?? "");
  if (!search.success) {
    return NextResponse.json(
      { error: "La recherche doit contenir entre 1 et 200 caractères." },
      { status: 400 },
    );
  }
  const results = await getAutocompleteSuggestions(search.data);
  return NextResponse.json(results);
}
