export const fetchJSON = async <Data = any>(url: string): Promise<Data> => {
  const res = await fetch(url);
  if (res.status !== 200) {
    console.error(`failed to load data for ${url}`);
    throw new Error(`failed to load data for ${url}`);
  }
  return await res.json();
};
