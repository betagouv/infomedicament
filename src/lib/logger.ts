import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "info-medicament",
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  },
  // Keep these redactions as a safety net when the logger is reused elsewhere.
  redact: {
    paths: [
      "authorization",
      "cookie",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[Redacted]",
  },
});
