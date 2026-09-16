export function requireNonEmpty(name: string, rows: unknown[]): void {
  if (rows.length === 0) {
    throw new Error(`${name} is empty; refusing to replace derived data`);
  }
}
