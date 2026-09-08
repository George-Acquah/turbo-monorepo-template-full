export interface TransactionAdapter<TTransaction> {
  begin(): Promise<TTransaction>;
  commit(transaction: TTransaction): Promise<void>;
  rollback(transaction: TTransaction): Promise<void>;
}

export async function withTransaction<TTransaction, TResult>(
  adapter: TransactionAdapter<TTransaction>,
  callback: (transaction: TTransaction) => Promise<TResult>,
): Promise<TResult> {
  const transaction = await adapter.begin();

  try {
    const result = await callback(transaction);
    await adapter.commit(transaction);
    return result;
  } catch (error) {
    await adapter.rollback(transaction);
    throw error;
  }
}
