#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
readonly COMPOSE_FILE="$PROJECT_DIR/.devcontainer/docker-compose.yml"

ENVIRONMENT="staging"
INPUT=""
ASSUME_YES=false
RUN_MIGRATIONS=true

usage() {
  cat <<'EOF'
Restore a PostgreSQL dump into the local Dev Container database.

By default, the latest successful Scalingo backup from staging is downloaded.

Usage:
  scripts/scalingo/restore_db.sh [options]

Options:
  --env <staging|prod>  Scalingo environment to download from (default: staging)
  --input <path>        Restore a local .tar.gz archive or pg_restore dump
  --yes                 Skip the destructive-operation confirmation
  --skip-migrations     Do not run Kysely migrations after the restore
  -h, --help            Show this help

Examples:
  ./scripts/scalingo/restore_db.sh
  ./scripts/scalingo/restore_db.sh --env prod
  ./scripts/scalingo/restore_db.sh --input /path/to/backup.tar.gz
EOF
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

while (($# > 0)); do
  case "$1" in
    --env)
      (($# >= 2)) || fail "--env requires a value"
      ENVIRONMENT="$2"
      shift 2
      ;;
    --input)
      (($# >= 2)) || fail "--input requires a path"
      INPUT="$2"
      shift 2
      ;;
    --yes)
      ASSUME_YES=true
      shift
      ;;
    --skip-migrations)
      RUN_MIGRATIONS=false
      shift
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
  staging|prod)
    ;;
  *)
    fail "--env must be 'staging' or 'prod'"
    ;;
esac

require_command docker
require_command tar

[[ -f "$COMPOSE_FILE" ]] || fail "Compose file not found: $COMPOSE_FILE"

if [[ -n "$INPUT" ]]; then
  [[ -f "$INPUT" ]] || fail "backup file not found: $INPUT"
  INPUT="$(cd -- "$(dirname -- "$INPUT")" && pwd)/$(basename -- "$INPUT")"
else
  [[ -x "$SCRIPT_DIR/download_db_backup.sh" ]] ||
    fail "backup download script is not executable: $SCRIPT_DIR/download_db_backup.sh"
fi

if [[ "$ASSUME_YES" != true ]]; then
  printf 'This will replace data in the local PostgreSQL database with a backup from %s.\n' \
    "${INPUT:-"Scalingo $ENVIRONMENT"}"
  read -r -p 'Continue? [y/N] ' answer
  [[ "$answer" =~ ^[Yy]$ ]] || {
    echo "Restore cancelled."
    exit 0
  }
fi

docker compose -f "$COMPOSE_FILE" ps --status running -q db-postgres | grep -q . ||
  fail "db-postgres is not running; start the Dev Container services first"

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/infomedicament-restore.XXXXXXXX")"
trap 'rm -rf -- "$WORK_DIR"' EXIT

if [[ -z "$INPUT" ]]; then
  ARCHIVE="$WORK_DIR/backup.tar.gz"
  "$SCRIPT_DIR/download_db_backup.sh" --env "$ENVIRONMENT" --output "$ARCHIVE"
  INPUT="$ARCHIVE"
fi

if tar -tzf "$INPUT" >/dev/null 2>&1; then
  EXTRACT_DIR="$WORK_DIR/extracted"
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$INPUT" -C "$EXTRACT_DIR"
  DUMP_COUNT="$(find "$EXTRACT_DIR" -type f | wc -l | tr -d ' ')"
  [[ "$DUMP_COUNT" == "1" ]] ||
    fail "expected exactly one dump in the backup archive, found $DUMP_COUNT"
  DUMP_FILE="$(find "$EXTRACT_DIR" -type f -print -quit)"
else
  DUMP_FILE="$INPUT"
fi

echo "Restoring $(basename -- "$DUMP_FILE") into the local PostgreSQL database..."
docker compose -f "$COMPOSE_FILE" exec -T db-postgres \
  pg_restore \
    --username postgres \
    --dbname postgres \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --no-comments \
    --exit-on-error < "$DUMP_FILE"

if [[ "$RUN_MIGRATIONS" == true ]]; then
  echo "Running Kysely migrations..."
  docker compose -f "$COMPOSE_FILE" exec -T app npm run db:migrate:latest
fi

echo "Database restore complete."
