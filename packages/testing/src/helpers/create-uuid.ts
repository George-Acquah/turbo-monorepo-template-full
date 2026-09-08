let sequence = 0;

export function createUuid(prefix = 'test'): string {
  sequence += 1;
  return `${prefix}-${sequence.toString().padStart(6, '0')}`;
}

export function resetUuidSequence(): void {
  sequence = 0;
}
