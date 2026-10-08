# Next.js caching policy

Application data caching uses Next.js Cache Components (`cacheComponents: true`).
Use `"use cache: remote"` and `cacheLife` for shared database and API reads.
The remote adapter stores entries in Redis when configured. The separate
Incremental Cache adapter serves Next's generated-page/ISR infrastructure;
neither adapter is an application-level memoization API.

## Lifetimes

- `hourly`: revalidate after one hour; expire after one day. Medicine details,
  composition, presentations, notice/RCP, safety events, stocks, pregnancy and
  pediatric alerts, MARR, generic-group membership, article data, synonyms,
  interaction lookups, and Matomo responses.
- `daily`: revalidate after one day; expire after one week. Alphabetical lists,
  substance/reference definitions, glossary, ATC data, generic-group codes,
  videos, sitemap, and reusable page subtrees.
- Grist uses local `"use cache"` with the `daily` profile, as specified in PR #300.

Read boundaries are cached so route handlers, metadata generation, and page
components share the same policy. Pure formatting helpers reuse cached reads.
ATC-label enrichment and article filtering cache their shared reference rows,
not every result projection or the full medicine objects passed into them.

## Intentional exclusions

- Free-text medicine search, autocomplete, and interaction search are uncached:
  their high-cardinality query keys have low reuse. Their small shared synonym
  and ATC-reference tables remain cached.
- Rating writes, request authorization tokens, rate-limit state, and debug
  memory snapshots are runtime state, not cached application data.
- Database connections, migrations, import jobs, and build-time warmup checks
  are operational resources and do not use Cache Components.
- SWR and React hooks manage browser UI state; they are independent of the
  server-side data cache. Autocomplete does not force browser HTTP caching.

Do not add React `cache`, `unstable_cache`, process-global Promise/data caches,
fetch `force-cache`, or route-segment `revalidate`/`dynamic` settings for server
application data. Resolve runtime route parameters outside cached scopes and
behind Suspense; pass their resolved values into cached components.

The startup launcher checks configured Redis connectivity and starts Next's
standalone server. Configure `HOSTNAME` and `PORT` in the deployment environment;
the launcher does not override them.
