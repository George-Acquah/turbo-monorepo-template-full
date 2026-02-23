/**
 * Slugify utility for generating URL-friendly slugs from text
 */

/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to slugify
 * @param options - Optional configuration
 * @returns A slugified string
 *
 * @example
 * slugify("Hello World!"); // "hello-world"
 * slugify("Ghana ERP System"); // "repo-system"
 * slugify("  Multiple   Spaces  "); // "multiple-spaces"
 */
export function slugify(
  text: string,
  options?: {
    separator?: string;
    lowercase?: boolean;
    maxLength?: number;
  },
): string {
  const separator = options?.separator ?? '-';
  const lowercase = options?.lowercase ?? true;
  const maxLength = options?.maxLength;

  let slug = text.trim();

  // Convert to lowercase if specified
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Replace spaces and special characters with separator
  slug = slug
    .replace(/[\s_]+/g, separator) // Replace spaces and underscores
    .replace(/[^\w-]+/g, '') // Remove non-word chars (except separator)
    .replace(new RegExp(`\\${separator}+`, 'g'), separator) // Replace multiple separators with single
    .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), ''); // Trim separators from start and end

  // Truncate if maxLength is specified
  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing separator if truncation created one
    slug = slug.replace(new RegExp(`\\${separator}+$`), '');
  }

  return slug;
}

/**
 * Generates a unique slug by appending a random suffix
 * @param text - The text to slugify
 * @param suffix - Optional suffix to append (defaults to random string)
 * @returns A unique slugified string
 *
 * @example
 * slugifyUnique("Ghana ERP"); // "repo-a1b2c3"
 * slugifyUnique("Company Admin", "001"); // "company-admin-001"
 */
export function slugifyUnique(
  text: string,
  suffix?: string,
  options?: {
    separator?: string;
    lowercase?: boolean;
    maxLength?: number;
  },
): string {
  const baseSlug = slugify(text, options);
  const uniqueSuffix = suffix ?? Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${uniqueSuffix}`;
}
