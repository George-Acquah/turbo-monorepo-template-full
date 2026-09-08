// No $extends(...) client extensions are registered yet. Soft-delete
// filtering (many models carry deletedAt) is handled explicitly in each
// adapter's where-clause rather than as a global extension — a global filter
// risks silently hiding rows that admin/recovery flows need to see. Add
// extensions here (and wire them in prisma.client.ts) if a genuine
// cross-cutting need shows up.
export {};
