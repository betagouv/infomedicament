export function getNormalizeLetter(letter: string): string {
  const newLetter = letter;
  newLetter.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return newLetter.toUpperCase();
}