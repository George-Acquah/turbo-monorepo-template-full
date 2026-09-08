// Mongoose Query methods mutate and return `this` for chaining, so applying
// the projection without reassigning avoids fighting Mongoose's (very deep)
// generic Query<> return types across .select()/.lean()/.exec() chains —
// unlike Prisma's `select`, Query#select() also doesn't accept `undefined`.
export function applySelect(
  query: { select: (fields: readonly string[]) => unknown },
  select: readonly string[] | undefined,
): void {
  if (select && select.length > 0) {
    query.select(select);
  }
}
