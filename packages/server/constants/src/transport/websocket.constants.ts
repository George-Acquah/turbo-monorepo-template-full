export const WsEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NOTIFICATION_RECEIVED: 'notification_received',
  WORKFLOW_UPDATED: 'workflow_updated',
} as const;

export type WsEvent = (typeof WsEvents)[keyof typeof WsEvents];
