import crypto from 'node:crypto';

export interface SlugOptions {
  separator?: string;
  lowercase?: boolean;
  maxLength?: number;
}

function safeRandomSuffix(): string {
  // better than Math.random for uniqueness consistency
  return crypto.randomBytes(4).toString('hex'); // 8 chars
}

export function slugify(text: string, options?: SlugOptions): string {
  const separator = options?.separator ?? '-';
  const lowercase = options?.lowercase ?? true;
  const maxLength = options?.maxLength;

  let slug = text.trim();

  if (lowercase) {
    slug = slug.toLowerCase();
  }

  slug = slug
    .replace(/[\s_]+/g, separator)
    .replace(/[^\w-]+/g, '')
    .replace(new RegExp(`\\${separator}+`, 'g'), separator)
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');

  if (maxLength && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    slug = slug.replace(new RegExp(`\\${separator}+$`), '');
  }

  return slug;
}

export function unslugify(slug: string, separator = '-'): string {
  return slug
    .trim()
    .replace(new RegExp(`\\${separator}+`, 'g'), ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugifyUnique(text: string, suffix?: string, options?: SlugOptions): string {
  const base = slugify(text, options);
  const unique = suffix ?? safeRandomSuffix();

  return `${base}-${unique}`;
}
