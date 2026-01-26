import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === 'development'

// Notes on CSP Headers :
// - script-src, we could use nonce to be extra safe, but probably overkill here
// - img-src must be updated when we store images on clevercloud
// - frame-ancestors: none means we cannot be integrated as an iframe on other sites
//
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${process.env.NEXT_PUBLIC_MATOMO_URL}${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${process.env.NEXT_PUBLIC_MATOMO_URL};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
    media-src 'self';
    connect-src 'self' ${process.env.NEXT_PUBLIC_MATOMO_URL};
`

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: "asset/resource",
    });
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/articles/:letter([A-Za-z])",
        destination: "/alpha_lists/articles/:letter",
      },
      {
        source: "/medicaments/:letter([A-Za-z0-9])",
        destination: "/alpha_lists/medicaments/:letter",
      },
      {
        source: "/pathologies/:letter([A-Za-z])",
        destination: "/alpha_lists/pathologies/:letter",
      },
      {
        source: "/substances/:letter([A-Za-z0-9\\(\\[])",
        destination: "/alpha_lists/substances/:letter",
      },
      {
        source: "/generiques/:letter([A-Za-z])",
        destination: "/alpha_lists/generiques/:letter",
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ]
  }
};

/**
 * The following environment variables are required in order for Sentry to work
 * and for the source maps to be uploaded correctly:
 * - SENTRY_DSN
 * - SENTRY_URL
 * - SENTRY_ORG
 * - SENTRY_PROJECT
 * - SENTRY_AUTH_TOKEN
 */
export default withSentryConfig(nextConfig, {
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
