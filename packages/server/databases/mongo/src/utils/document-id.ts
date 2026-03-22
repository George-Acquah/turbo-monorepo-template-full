import { randomUUID } from 'node:crypto';

export function generateDocumentId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '')}`;
}
