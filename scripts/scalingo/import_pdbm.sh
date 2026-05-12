#!/usr/bin/env bash
set -euo pipefail

TUNNEL_PORT=10000

# --- Parse named flags ---
ENV=""
INPUT=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --env)   ENV="$2";   shift 2 ;;
    --input) INPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Validate ---
if [[ -z "$ENV" ]]; then
  echo "Error: --env is required (staging|prod)"
  echo "Usage: $0 --env <staging|prod> --input <dump_with_pk.sql>"
  exit 1
fi

if [[ -z "$INPUT" ]]; then
  echo "Error: --input is required"
  echo "Usage: $0 --env <staging|prod> --input <dump_with_pk.sql>"
  exit 1
fi

case "$ENV" in
  staging) APP="infomedicament-staging"; REGION="osc-fr1" ;;
  prod)    APP="infomedicament-prod";    REGION="osc-secnum-fr1" ;;
  *) echo "Error: --env must be 'staging' or 'prod'"; exit 1 ;;
esac

# --- Parse credentials from SCALINGO_MYSQL_URL ---
echo "Fetching credentials for $APP..."
RAW_URL=$(scalingo -a "$APP" --region "$REGION" env | grep SCALINGO_MYSQL_URL | cut -d= -f2-)

# URL format: mysql://user:password@host:port/dbname
USERINFO="${RAW_URL#mysql://}"          # user:password@host:port/dbname
DB_USER="${USERINFO%%:*}"               # user
USERINFO="${USERINFO#*:}"              # password@host:port/dbname
DB_PASS="${USERINFO%%@*}"              # password

# Check tunnel is open
if ! nc -z 127.0.0.1 "$TUNNEL_PORT" 2>/dev/null; then
  echo "Error: no tunnel detected on port $TUNNEL_PORT."
  echo "Open one first with:"
  echo "  scalingo -a $APP --region $REGION db-tunnel SCALINGO_MYSQL_URL"
  exit 1
fi

# Import
echo "Importing $INPUT into $APP..."
mysql -h 127.0.0.1 -P "$TUNNEL_PORT" -u "$DB_USER" -p"$DB_PASS" pdbm_bdd < "$INPUT"

# Run one-off container: rebuild resume tables and search index
echo "Rebuilding resume_* tables and search index on $APP..."
scalingo -a "$APP" --region "$REGION" run "for x in pathos substances specialites atc1 atc2 generiques; do node .next/standalone/scripts/updateResumeData.js \$x; done && node .next/standalone/scripts/seedSearchIndex.js"

echo "All done!"
