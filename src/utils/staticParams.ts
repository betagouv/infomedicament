/**
 * Cache Components validates dynamic routes using at least one generated path.
 * Keep builds valid when a review application's database has not been seeded yet.
 */
export function withStaticParamFallback<T>(params: T[], fallback: T): T[] {
  return params.length > 0 ? params : [fallback];
}
