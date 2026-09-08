export const WorkflowNodeType = {
  START: 'START',
  END: 'END',
  FAILURE: 'FAILURE',
  CONDITION: 'CONDITION',
  ACTION: 'ACTION',
  APPROVAL: 'APPROVAL',
  DELAY: 'DELAY',
  FAN_OUT: 'FAN_OUT',
  FAN_IN: 'FAN_IN',
} as const;

export type WorkflowNodeType = (typeof WorkflowNodeType)[keyof typeof WorkflowNodeType];

export const WorkflowApproverType = {
  ROLE: 'ROLE',
  USER: 'USER',
  DYNAMIC: 'DYNAMIC',
} as const;

export type WorkflowApproverType = (typeof WorkflowApproverType)[keyof typeof WorkflowApproverType];

export const WorkflowDelayType = {
  FIXED: 'FIXED',
  DYNAMIC: 'DYNAMIC',
} as const;

export type WorkflowDelayType = (typeof WorkflowDelayType)[keyof typeof WorkflowDelayType];

export const WorkflowFanOutStrategy = {
  ALL_COMPLETE: 'ALL_COMPLETE',
  ANY_COMPLETE: 'ANY_COMPLETE',
  N_OF_M: 'N_OF_M',
} as const;

export type WorkflowFanOutStrategy =
  (typeof WorkflowFanOutStrategy)[keyof typeof WorkflowFanOutStrategy];

export const WorkflowConfigActionType = {
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',
  CREATE_REMINDER: 'CREATE_REMINDER',
  UPDATE_INVOICE_STATUS: 'UPDATE_INVOICE_STATUS',
  GENERATE_REPORT: 'GENERATE_REPORT',
  EMIT_EVENT: 'EMIT_EVENT',
  WEBHOOK: 'WEBHOOK',
} as const;

export type WorkflowConfigActionType =
  (typeof WorkflowConfigActionType)[keyof typeof WorkflowConfigActionType];
