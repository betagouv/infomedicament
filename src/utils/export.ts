import { EXPORT_FIELDS, ExportFieldKey, ExportSpecs } from "@/types/ExportTypes";

export function buildExportCsv(results: ExportSpecs[], selectedFields: ExportFieldKey[]): string {
  const fields = EXPORT_FIELDS.filter((f) => selectedFields.includes(f.key));
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = fields.map((f) => escape(f.label)).join(";");
  const rows = results.map((spec) => fields.map((f) => escape(f.format(spec))).join(";"));
  return [header, ...rows].join("\n");
}
