export function escapeSingleQuotes(value: string): string {
  return value.replace(/'/g, "''");
}

export function escapeDoubleQuotes(value: string): string {
  return value.replace(/"/g, '""');
}
