export const isOuiOrNon = (value: any): value is "oui" | "non" =>
  typeof value === "string" &&
  (value.trim() === "oui" || value.trim() === "non");