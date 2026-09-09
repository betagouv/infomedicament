# Load testing

The load tests use [Artillery](https://www.artillery.io/docs) and send HTTP
requests rather than launching browsers. They measure application and database
behavior without downloading every browser asset.

## Traffic model

Each virtual user sends one request. Scenario weights therefore approximate the
request distribution directly:

| Traffic                                         | Default weight | Data source                                        |
| ----------------------------------------------- | -------------: | -------------------------------------------------- |
| Popular medicine pages                          |            40% | `scripts/seed_cis_codes.txt`                       |
| Long-tail medicine pages                        |            40% | Stable sitemap sample in `load-tests/test-data.ts` |
| Search endpoint                                 |            10% | Representative search terms                        |
| Homepage                                        |             5% | `/`                                                |
| Substance, indication, or groupe generique page |             5% | Canonical paths in `load-tests/test-data.ts`       |

The popular CIS codes are also prerendered by the application. The long-tail
sample deliberately excludes those codes to exercise pages outside that warmup
set. Scalingo review apps only seed the popular CIS codes, so use a fully
populated staging or performance environment to test the 40/40 distribution.

## Running a test

Artillery 2.0.34 requires Node 22.18 or later. Install dependencies, then provide
the target explicitly:

```bash
npm ci
TARGET_URL=https://staging.example.net npm run test:load
```

There is no default remote target. By default, the test ramps from zero to 50
requests per second over 60 seconds, then holds 50 requests per second for three
minutes. Production additionally requires explicit confirmation:

```bash
TARGET_URL=https://infomedicament.beta.gouv.fr \
ALLOW_PRODUCTION_LOAD_TEST=true \
npm run test:load
```

Do not run against production without an agreed test window and traffic ceiling.

## Settings

Configure a run with environment variables:

| Variable                    |  Default | Meaning                                       |
| --------------------------- | -------: | --------------------------------------------- |
| `TARGET_URL`                | Required | Origin to test, without a path                |
| `ARRIVAL_RATE`              |      `0` | Starting virtual users per second             |
| `RAMP_TO`                   |     `50` | Arrival rate reached during the ramp          |
| `RAMP_DURATION_SECONDS`     |     `60` | Ramp duration                                 |
| `PLATEAU_DURATION_SECONDS`  |    `180` | Duration at the final arrival rate            |
| `MAX_VUS`                   |    `100` | Maximum concurrent virtual users              |
| `TIMEOUT_SECONDS`           |     `10` | HTTP request timeout                          |
| `P95_MS`                    |   `2000` | Maximum accepted aggregate p95 response time  |
| `MAX_ERROR_RATE_PERCENT`    |      `1` | Maximum accepted scenario error percentage    |
| `POPULAR_MEDICINE_WEIGHT`   |     `40` | Relative popular-medicine weight              |
| `LONG_TAIL_MEDICINE_WEIGHT` |     `40` | Relative long-tail-medicine weight            |
| `SEARCH_WEIGHT`             |     `10` | Relative search weight                        |
| `HOMEPAGE_WEIGHT`           |      `5` | Relative homepage weight                      |
| `CANONICAL_PAGE_WEIGHT`     |      `5` | Relative other-page weight                    |

Weights are relative and do not need to total 100. A ramp is followed
automatically by a plateau. This example ramps from one to two requests per
second over two minutes, then remains at two requests per second for five
minutes:

```bash
TARGET_URL=https://staging.example.net \
ARRIVAL_RATE=1 \
RAMP_TO=2 \
RAMP_DURATION_SECONDS=120 \
PLATEAU_DURATION_SECONDS=300 \
npm run test:load
```

Artillery adds `user-agent: infomedicament-artillery-load-test` and an
`x-load-test-id` header to make generated traffic identifiable.

## Rate limiting

The 200 requests/minute limit is implemented by Infomedicament, not Scalingo.
`src/proxy.ts` applies it per source IP and independently in each application
container. A single load generator can therefore reach the limit above roughly
3.3 requests/second on one container. A `429` response fails the load-test status
expectation.

HTTP requests with `Sec-Fetch-Dest: empty` bypass the application limiter because
that header identifies browser fetch requests. Artillery does not forge that
header, so its requests exercise the normal limited path.

Relevant Scalingo documentation:

- [Public routing](https://doc.scalingo.com/platform/networking/public/routing)
- [Application metrics](https://doc.scalingo.com/platform/app/metrics)
- [Scaling applications](https://doc.scalingo.com/platform/app/scaling/scaling)
- [Deployment limits](https://doc.scalingo.com/platform/deployment/limits)

Scalingo's deployment limits are build/deployment constraints and do not
document a 200 requests/minute application limit. Confirm permitted load levels,
platform ingress protections, and any temporary allowlisting directly with
Scalingo before a high-volume run.

## During a run

Watch the Scalingo Metrics tab for requests per minute, HTTP 5xx responses, p95
and p99 response times, CPU, memory, swap, and container restarts. Also monitor
PostgreSQL connections and resource usage. The application currently samples
100% of Sentry server traces and logs every proxied request, which may add cost
and overhead during a large test.
