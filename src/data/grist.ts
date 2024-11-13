import "server-cli-only";

function matchesFields<F extends string[]>(
  record: Record<string, string | number>,
  fields: F,
): record is Record<F[number], string | number> {
  return fields.every((key) => key in record);
}

// Cache Grist data to avoid fetching it multiple times.
const gristCache = new Map<string, Promise<any>>();
export const getGristTableData = <F extends string>(
  tableId: string,
  fields: F[],
): Promise<{ id: number; fields: Record<F, string | number | boolean> }[]> => {
  if (!gristCache.has(tableId)) {
    gristCache.set(tableId, uncachedGetGristTableData(tableId, fields));
  }
  return gristCache.get(tableId) as Promise<
    { id: number; fields: Record<F, string | number> }[]
  >;
};

async function uncachedGetGristTableData<F extends string>(
  tableId: string,
  fields: F[],
): Promise<{ id: number; fields: Record<F, string | number | boolean> }[]> {
  const response = await fetch(
    `https://grist.numerique.gouv.fr/api/docs/${process.env.GRIST_DOC_ID}/tables/${tableId}/records?sort=manualSort`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GRIST_API_KEY}`,
        Accept: "application/json",
      },
      cache: "force-cache",
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
}
