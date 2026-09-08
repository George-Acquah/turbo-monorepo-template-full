export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (m) => m.toLowerCase());
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toSnakeCase(str: string): string {
  return str.replace(/\W+/g, ' ').trim().replace(/\s+/g, '_').toLowerCase();
}

export function toKebabCase(str: string): string {
  return str.replace(/\W+/g, ' ').trim().replace(/\s+/g, '-').toLowerCase();
}

export function toLowerCase(str: string): string {
  return str.replace(' ', '').toLowerCase().trim();
}
