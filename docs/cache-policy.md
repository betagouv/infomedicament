# Next.js caching policy

Application data caching uses Next.js Cache Components (`cacheComponents: true`)
and Partial Prefetching (`partialPrefetching: true`).
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

## Next.js handler contract

Cache Components shipped in Next.js 16. This branch uses Next.js 16.4.0; the
review follows the current official [Cache Components release notes](https://nextjs.org/blog/next-16),
[remote cache guidance](https://nextjs.org/docs/app/api-reference/directives/use-cache-remote),
and [custom handler contract](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers),
checked against the installed Next.js implementation.

- Cache keys use resolved, shared inputs; request authentication and arbitrary
  search strings remain outside shared cached scopes.
- Remote entries store completed serialized bytes and return a fresh stream on
  every hit. Interrupted streams are discarded. Writes are atomic, and failed
  reads become misses; failed writes are logged without failing the render.
- Redis retains remote entries until hard expiration, allowing Next to refresh
  stale data in the background after the profile's revalidation interval.
- Tag invalidation honors immediate expiration and delayed expiration with
  stale-while-revalidate. The remote handler checks implicit tags directly from
  Redis; `refreshTags` needs no local-manifest synchronization.
- Incremental page entries include Next's implicit header tags, and fetch reads
  check their soft tags. Delayed invalidation respects its expiration deadline.
- Invalidation markers have no short Redis TTL: deleting a marker while an old
  entry survives would make invalidated data valid again. Markers are scoped to
  the application/release namespace, which deployment cleanup may retire only
  after that release is no longer serving requests.

The startup connectivity check still refuses to start with configured but
unavailable Redis. Runtime storage failures are logged and leave Next free to
regenerate data from its source. No explicit application `cacheTag` policy is
introduced; current application freshness remains governed by the profiles.

## Next.js 16.4 review

Next.js 16.4 [recommends Cache Components for every app](https://nextjs.org/blog/next-16-4).
Partial Prefetching is enabled alongside Cache Components so navigation shares
static app shells and resolves URL-dependent cached content on navigation.
Existing intentional `prefetch: false` settings remain unchanged.

The custom handlers were checked against the installed 16.4 CacheHandler types,
Next's default handler, and the implicit-tag behavior in its cache wrapper.
The existing profiles, Redis stream serialization, atomic writes, error handling,
and distributed tag checks remain compatible. Shared cache scopes still exclude
request authentication and free-text search keys; resolved URL inputs enter
cached functions through Suspense.

The container layout renders one shared cached header component. Its client
component uses `useSelectedLayoutSegment` to hide search on the home and search
pages and show it on other container pages, including during client navigation.
The route-aware client header is inside Suspense, as required for dynamic routes
with Cache Components.
There is no parallel header slot or route-specific header re-export boilerplate.
The standalone embed page remains outside the container layout. Strict route
matching remains enabled.

Verification on 16.4.0: 260 unit tests (including 24 adapter regression tests),
TypeScript, source lint, and the default Turbopack production build passed,
generating 711 pages. The framework upgrade also passed a webpack build.
Standalone Chromium smoke checks confirmed home/search header variants, header
search visibility during client navigation in both directions, rewritten list
URLs, dynamic medicine pages, the separate embed layout, and the autocomplete
API. Runtime Redis failure and invalidation tests use a
shared simulated Redis store; this check does not benchmark deployment latency.
