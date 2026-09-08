export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

// AccountClaimToken (guest → account claim, doc 06 §5) — same shape as
// InvitationStatus but a distinct constant: a claim token isn't an
// invitation (no inviter, no identity role), and its own name avoids
// conflating the two concepts even though the values line up.
export const AccountClaimTokenStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type AccountClaimTokenStatus =
  (typeof AccountClaimTokenStatus)[keyof typeof AccountClaimTokenStatus];
