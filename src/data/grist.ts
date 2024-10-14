export async function getGristTableData(
  tableId: string,
): Promise<{ id: number; fields: Record<string, string | number> }[]> {
  const response = await fetch(
    `https://grist.numerique.gouv.fr/api/docs/${process.env.GRIST_DOC_ID}/tables/${tableId}/records`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GRIST_API_KEY}`,
      },
    },
  );
  return (await response.json()).records;
}
