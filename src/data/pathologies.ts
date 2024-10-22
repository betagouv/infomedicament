import { getGristTableData } from "@/data/grist";

export async function getPathologyDefinition(
  code: `${number}`,
): Promise<string> {
  const data = await getGristTableData("Pathologies", [
    "codePatho",
    "Definition_pathologie",
  ]);
  const record = data.find(
    (record: any) => record.fields.codePatho === Number(code),
  );
  if (!record) {
    throw new Error(`Pathology code not found: ${code}`);
  }

  return record.fields.Definition_pathologie as string;
}
