import { withSentryConfig } from "@sentry/nextjs";

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
        source: "/medicaments/:letter([A-Za-z])",
        destination: "/alpha_lists/medicaments/:letter",
      },
      {
        source: "/pathologies/:letter([A-Za-z])",
        destination: "/alpha_lists/pathologies/:letter",
      },
      {
        source: "/substances/:letter([A-Za-z])",
        destination: "/alpha_lists/substances/:letter",
      },
      {
        source: "/generiques/:letter([A-Za-z])",
        destination: "/alpha_lists/generiques/:letter",
      },
    ];
  },
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
