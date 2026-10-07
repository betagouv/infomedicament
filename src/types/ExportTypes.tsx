import { ResumeSpecialiteDB } from "@/db/types";
import { formatIndicationsDetails, getProcedureLibLong } from "@/utils/specialites";
import { SpecialiteProcedure } from "@/types/SpecialiteTypes";

export const RCP_EXPORT_FIELD_KEYS = ["rcp43", "rcp44", "rcp45"] as const;
export type RcpExportFieldKey = (typeof RCP_EXPORT_FIELD_KEYS)[number];

export const EXPORT_FIELD_KEYS = [
  "specId",
  "specName",
  "genericGroup",
  "composants",
  "atc1Code",
  "atc2Code",
  "atc5Code",
  "indications",
  "statutBdm",
  "isSurveillanceRenforcee",
  "isAlertPregnancyPlan",
  "isAlertPregnancyMention",
  "isAlertPediatricContraindication",
  "ammActiveFrance",
  "typeProcedure",
  ...RCP_EXPORT_FIELD_KEYS,
] as const;
export type ExportFieldKey = (typeof EXPORT_FIELD_KEYS)[number];

export const RCP_ANCHOR_BY_FIELD_KEY: Record<RcpExportFieldKey, string> = {
  rcp43: "RcpContreindications",
  rcp44: "RcpMisesEnGarde",
  rcp45: "RcpInteractionsMed",
};
export const RCP_SECTION_NUMBER_BY_FIELD_KEY: Record<RcpExportFieldKey, string> = {
  rcp43: "4.3",
  rcp44: "4.4",
  rcp45: "4.5",
};

export interface ExportSpecs extends ResumeSpecialiteDB {
  genericGroup?: string;
  ammActiveFrance?: boolean;
  rcp43?: string;
  rcp44?: string;
  rcp45?: string;
}

export interface ExportField {
  key: ExportFieldKey;
  label: string;
  format: (spec: ExportSpecs) => string;
}

const boolLabel = (value: boolean) => (value ? "Oui" : "Non");

export const EXPORT_FIELDS: ExportField[] = [
  { key: "specId", label: "CIS", format: (s) => s.specId },
  { key: "specName", label: "Nom de la spécialité", format: (s) => s.specName },
  { key: "genericGroup", label: "Groupe générique", format: (s) => s.genericGroup ?? "" },
  { key: "composants", label: "Substances actives", format: (s) => s.composants },
  { key: "atc1Code", label: "Code ATC1", format: (s) => s.atc1Code ?? "" },
  { key: "atc2Code", label: "Code ATC2", format: (s) => s.atc2Code ?? "" },
  { key: "atc5Code", label: "Code ATC5", format: (s) => s.atc5Code ?? "" },
  {
    key: "indications",
    label: "Indications",
    format: (s) =>
      formatIndicationsDetails(s.indicationsIdsNames)
        .map((i) => i.nomIndication)
        .join(", "),
  },
  { key: "statutBdm", label: "Statut BDM (code)", format: (s) => s.StatutBdm.toString() },
  {
    key: "isSurveillanceRenforcee",
    label: "Surveillance renforcée",
    format: (s) => boolLabel(s.isSurveillanceRenforcee),
  },
  {
    key: "isAlertPregnancyPlan",
    label: "Alerte grossesse (plan)",
    format: (s) => boolLabel(s.isAlertPregnancyPlan),
  },
  {
    key: "isAlertPregnancyMention",
    label: "Alerte grossesse (mention)",
    format: (s) => boolLabel(s.isAlertPregnancyMention),
  },
  {
    key: "isAlertPediatricContraindication",
    label: "Contre-indication pédiatrique",
    format: (s) => boolLabel(s.isAlertPediatricContraindication),
  },
  {
    key: "ammActiveFrance",
    label: "AMM active en France",
    format: (s) => (s.ammActiveFrance === undefined ? "" : boolLabel(s.ammActiveFrance)),
  },
  {
    key: "typeProcedure",
    label: "Type de procédure",
    format: (s) => getProcedureLibLong(s.ProcId as SpecialiteProcedure) ?? "",
  },
  {
    key: "rcp43",
    label: "RCP 4.3 - Contre-indications",
    format: (s) => s.rcp43 ?? "",
  },
  {
    key: "rcp44",
    label: "RCP 4.4 - Mises en garde spéciales et précautions d'emploi",
    format: (s) => s.rcp44 ?? "",
  },
  {
    key: "rcp45",
    label: "RCP 4.5 - Interactions avec d'autres médicaments et autres formes d'interactions",
    format: (s) => s.rcp45 ?? "",
  },
];

export const DEFAULT_EXPORT_FIELD_KEYS: ExportFieldKey[] = [
  "specId",
  "specName",
  "composants",
  "atc2Code",
];

export interface SubstanceOption {
  subsId: string;
  nomLib: string;
}

export interface AtcOption {
  atc1Code: string;
  atc1Label: string;
  atc2 : {
    atc2Code: string;
    atc2Label: string;
  }[];
}
