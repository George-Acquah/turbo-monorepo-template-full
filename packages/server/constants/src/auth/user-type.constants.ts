export const UserType = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  STAFF: 'STAFF',
  MEMBER: 'MEMBER',
  API_CLIENT: 'API_CLIENT',
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];
