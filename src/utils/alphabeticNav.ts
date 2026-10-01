export function normalizeString(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getNormalizeLetter(letter: string): string {
  return normalizeString(letter).toUpperCase();
}
