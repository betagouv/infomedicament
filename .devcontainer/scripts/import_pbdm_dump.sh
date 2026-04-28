#!/usr/bin/env bash
set -euo pipefail

MYSQL="mysql -h db-mysql -uroot -pmysql"

# Parse named flags
INPUT=""
OUTPUT=""

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --input)  INPUT="$2";  shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$INPUT" ]]; then
  echo "Error: --input is required"
  echo "Usage: $0 --input <dump.sql> [--output <out.sql>]"
  exit 1
fi

if [[ -z "$OUTPUT" ]]; then
  OUTPUT="${INPUT%.sql}_with_pk.sql"
fi

# Import
echo "Importing $INPUT into pdbm_bdd..."
$MYSQL --force pdbm_bdd < "$INPUT"

# Temporarily deactivate strict SQL mode to allow import of '0000-00-00' dates
$MYSQL -e "SET GLOBAL sql_mode='';"

# Add PKs to the tables (Scalingo expects those)
echo "Adding primary keys to tables..."
npx tsx bin/pdbm.ts

# Reactivate strict SQL mode
$MYSQL -e "SET GLOBAL sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';"

# Export
echo "Exporting to $OUTPUT..."
mysqldump -h db-mysql -uroot -pmysql --single-transaction pdbm_bdd > "$OUTPUT"

echo "Done. Output written to $OUTPUT"