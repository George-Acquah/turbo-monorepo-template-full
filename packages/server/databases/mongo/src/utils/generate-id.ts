import { createId } from '@paralleldrive/cuid2';

export const generateId = (prefix?: string): string => {
  const id = createId();
  return prefix ? `${prefix}_${id}` : id;
};
