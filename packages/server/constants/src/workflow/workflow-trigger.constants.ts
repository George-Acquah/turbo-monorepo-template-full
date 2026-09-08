export const WorkflowTriggerType = {
  EVENT: 'EVENT',
  SCHEDULE: 'SCHEDULE',
  MANUAL: 'MANUAL',
  API: 'API',
} as const;

export type WorkflowTriggerType = (typeof WorkflowTriggerType)[keyof typeof WorkflowTriggerType];
