import { MatomoErrorResult } from "@/types/Matomo";

type ConfigType = Record<string, unknown>;

const matomoConfig = {
  matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
  matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
  matomoToken: process.env.MATOMO_TOKEN,
};

const configToURI = (config: ConfigType) =>
  Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

const buildMatomoURL = (config: ConfigType = {}, bulkConfig: ConfigType[] = []) => {
  const queryParams = {
    token_auth: matomoConfig.matomoToken,
    idSite: matomoConfig.matomoSiteId,
    format: 'JSON',
    module: 'API',
    method: 'API.getBulkRequest',
    ...bulkConfig.reduce(
      (acc, configEntry: ConfigType, i: number) => ({
        ...acc,
        [`urls[${i}]`]: encodeURIComponent(configToURI({ ...config, ...configEntry })),
      }),
      {}
    ),
  };
  return `${matomoConfig.matomoServerURL}?${configToURI(queryParams)}`;
};

export const bulkFetchRangeFromMatomo = async <Result>(
  config: ConfigType,
  reducer?: (entry: Result) => object
): Promise<(Result & { date: string })[]> => {
  const period: string[] = config.date ? [config.date as string] : generateMonthsToNow();

  const response = await fetch(
    buildMatomoURL(
      config,
      period.map((date) => ({
        date,
      }))
    )
  );
  if (!response.ok) {
    throw new Error(`invalid matomo status: ${response.status}`);
  }

  const bulkResults: Result[][] | MatomoErrorResult[] = await response.json();
  // consider failure if the first bulk result is an error
  if (isMatomoErrorResult(bulkResults)) {
    throw new Error(`matomo error: ${(bulkResults[0] as MatomoErrorResult).message}`);
  }

  return bulkResults.map((bulkResult, i) => ({
    date: period[i],
    ...(reducer
      ? bulkResult.reduce((acc, entry) => {
          return {
            ...acc,
            ...reducer(entry),
          };
        }, {} as any)
      : bulkResult),
  }));
};


function isMatomoErrorResult<Result>(bulkResults: Result[][] | MatomoErrorResult[]): bulkResults is MatomoErrorResult[] {
  return (bulkResults[0] as any).result === 'error';
}

//Génère les mois de 2024 à maintenant
export function generateMonthsToNow(): string[] {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const display = 12 * (year - 2024) + month;
  currentDate.setMonth(currentDate.getMonth() - 1);
  currentDate.setDate(1);
  const months = Array(display)
    .fill(null)
    .map((v, i) => {
      const baseDate = new Date(currentDate.toDateString());
      baseDate.setMonth(baseDate.getMonth() - i);
      const date = `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1).toString().padStart(2, '0')}-${baseDate
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      return date;
    });
  return months;
}
