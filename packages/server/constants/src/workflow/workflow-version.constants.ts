// WorkflowVersionStatus mirrors WorkflowStatus — the workflow_versions table
// uses the same set of values. Re-exported here as a named alias so callers
// can be explicit about which table they are referencing.
export {
  WorkflowStatus as WorkflowVersionStatus,
  type WorkflowStatus as WorkflowVersionStatusType,
} from './workflow-status.constants';
