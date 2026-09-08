export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleCase(str: string): string {
  return str.toLowerCase().split(' ').map(capitalize).join(' ');
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

export function formatWords(...wordsArray: (string | null | undefined)[]): string | null {
  return wordsArray.filter(Boolean).join(' ') || null;
}
