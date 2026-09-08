import { createId } from "@paralleldrive/cuid2";

/**
 * Generate a prefixed ID: `<prefix>_<24-hex-chars>`
 */
export function id(prefix: string): string {
  const iid = createId();
  return prefix ? `${prefix}_${iid}` : iid;
}
