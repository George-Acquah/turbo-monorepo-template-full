export const RpcMethods = {
  EXECUTE_WORKFLOW: 'execute_workflow',
  GET_USER_ROLES: 'get_user_roles',
} as const;

export type RpcMethod = (typeof RpcMethods)[keyof typeof RpcMethods];
