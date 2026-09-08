export const DecoratorKeys = {
  PERMISSION: 'permission',
  ROLES: 'roles',
  REQUIRED_MODULE: 'requiredModule',
} as const;

export type DecoratorKey = (typeof DecoratorKeys)[keyof typeof DecoratorKeys];
