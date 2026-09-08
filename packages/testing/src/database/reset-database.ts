export interface DatabaseResetAdapter {
  reset(): Promise<void>;
}

export interface TableCleanupAdapter {
  truncateTables(tableNames: readonly string[]): Promise<void>;
}

export async function resetDatabase(adapter: DatabaseResetAdapter): Promise<void> {
  await adapter.reset();
}

export async function truncateTables(
  adapter: TableCleanupAdapter,
  tableNames: readonly string[],
): Promise<void> {
  await adapter.truncateTables(tableNames);
}
