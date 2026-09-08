// Small composable where-fragment helpers reused across the auth query layer.

export function activeSessionWhere() {
  return {
    revokedAt: null,
    expiresAt: { gt: new Date() },
  };
}

export function unusedNonExpiredTokenWhere() {
  return {
    usedAt: null,
    expiresAt: { gt: new Date() },
  };
}
