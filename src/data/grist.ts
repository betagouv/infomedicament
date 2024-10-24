import "server-only";

function matchesFields<F extends string[]>(
  record: Record<string, string | number>,
  fields: F,
): record is Record<F[number], string | number> {
  return fields.every((key) => key in record);
}

export const getGristTableData = async function <F extends string>(
  tableId: string,
  fields: F[],
): Promise<{ id: number; fields: Record<F, string | number> }[]> {
  const response = await fetch(
    `https://grist.numerique.gouv.fr/api/docs/${process.env.GRIST_DOC_ID}/tables/${tableId}/records`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GRIST_API_KEY}`,
        Accept: "application/json",
      },
    },
  );

  const body = await response.json();
  if ("error" in body) {
    throw Error(`Grist error: ${body.error}`);
  }

  const data = body.records as {
    id: number;
    fields: Record<string, string>;
  }[];

  if (!data) {
    throw Error(`No Grist data for table ${tableId}.`);
  }

  if (data.length && !matchesFields(data[0].fields, fields)) {
    throw Error(
      `Grist data for table ${tableId} does not match expected fields.`,
    );
  }

  return data;
};
