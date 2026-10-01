#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

ENVIRONMENT="staging"
OUTPUT=""

usage() {
  cat <<'EOF'
Download the latest successful PostgreSQL backup from Scalingo.

Usage:
  scripts/scalingo/download_db_backup.sh [options]

Options:
  --env <staging|prod>  Scalingo environment to download from (default: staging)
  --output <path>       Destination archive path
  -h, --help            Show this help

If --output is omitted, the archive is saved under data/backups/.

Examples:
  ./scripts/scalingo/download_db_backup.sh
  ./scripts/scalingo/download_db_backup.sh --env prod
  ./scripts/scalingo/download_db_backup.sh --output /tmp/staging-backup.tar.gz
EOF
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

while (($# > 0)); do
  case "$1" in
    --env)
      (($# >= 2)) || fail "--env requires a value"
      ENVIRONMENT="$2"
      shift 2
      ;;
    --output)
      (($# >= 2)) || fail "--output requires a path"
      OUTPUT="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1 (see --help)"
      ;;
  esac
done

case "$ENVIRONMENT" in
  staging)
    APP="infomedicament-staging"
    REGION="osc-fr1"
    ;;
  prod)
    APP="infomedicament-prod"
    REGION="osc-secnum-fr1"
    ;;
  *)
    fail "--env must be 'staging' or 'prod'"
    ;;
esac

command -v scalingo >/dev/null 2>&1 || fail "required command not found: scalingo"

if [[ -z "$OUTPUT" ]]; then
  OUTPUT="$PROJECT_DIR/data/backups/${ENVIRONMENT}-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
fi

OUTPUT_DIR="$(dirname -- "$OUTPUT")"
mkdir -p "$OUTPUT_DIR"
OUTPUT="$(cd -- "$OUTPUT_DIR" && pwd)/$(basename -- "$OUTPUT")"

[[ ! -e "$OUTPUT" ]] || fail "output file already exists: $OUTPUT"

echo "Downloading the latest successful PostgreSQL backup from $APP ($REGION)..."
scalingo --app "$APP" --region "$REGION" --addon postgresql \
  backups-download --output "$OUTPUT"

echo "Backup downloaded to $OUTPUT"
