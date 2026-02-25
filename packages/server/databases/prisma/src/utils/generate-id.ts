// packages/utils/src/id.ts
// Utility wrapper around cuid2 to keep ID generation centralized.

import { createId } from '@paralleldrive/cuid2';

/**
 * Generates a unique ID with an optional model prefix
 * @param prefix - Optional model prefix (e.g., 'cust' for customer, 'inv' for invoice)
 * @returns A unique ID string, optionally prefixed with the model shortcode
 *
 * @example
 * generateId(); // "clhqx8y7z0000xyz..."
 * generateId('cust'); // "cust_clhqx8y7z0000xyz..."
 * generateId('inv'); // "inv_clhqx8y7z0000xyz..."
 */
export const generateId = (prefix?: string): string => {
  const id = createId();
  return prefix ? `${prefix}_${id}` : id;
};
