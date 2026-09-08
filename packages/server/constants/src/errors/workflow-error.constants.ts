export const WorkflowErrorCodes = {
  WORKFLOW_NOT_FOUND: 'WORKFLOW_NOT_FOUND',
  WORKFLOW_INVALID_STATE: 'WORKFLOW_INVALID_STATE',
  WORKFLOW_EXECUTION_FAILED: 'WORKFLOW_EXECUTION_FAILED',
} as const;

export type WorkflowErrorCode = (typeof WorkflowErrorCodes)[keyof typeof WorkflowErrorCodes];
