/** Excel-compatible UTF-8 CSV. Quoting also preserves delimiters and newlines. */
export function csvLine(values: (string | null | undefined)[]): string {
  return (
    values
      .map((value) => {
        let text = value ?? "";
        // Catalogue labels must never be interpreted as spreadsheet formulas.
        if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
          text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      })
      .join(";") + "\r\n"
  );
}
export const searchCsvHeaders = [
  "Code CIS",
  "Dénomination",
  "Substances",
  "Titulaires",
  "Codes ATC",
  "Libellés ATC",
  "Type de procédure",
  "État de l’autorisation",
  "Date d’autorisation",
  "Statut de commercialisation",
  "Date de mise à jour du RCP",
  "Lien vers la fiche",
];
