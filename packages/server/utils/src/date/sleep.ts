/**
 * Delays execution for the specified duration.
 *
 * @example
 * await sleep(500);
 * await sleep(5 * SECOND);
 */
export async function sleep(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return;
  }

  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}