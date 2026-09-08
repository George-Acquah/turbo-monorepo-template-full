import { EventType, StrictlyTypedWorkspaceEvent } from '@workspace/types/events';

/**
 * Now handlers can declare exactly which EventType they handle,
 * and the payload type flows automatically.
 */
export abstract class WorkspaceEventHandlerPort<K extends EventType = EventType> {
  // Enforce that this handler only works for specific event types
  abstract supports(eventType: EventType): boolean;

  // TypeScript will automatically know the exact structure of event.payload!
  abstract handle(event: StrictlyTypedWorkspaceEvent<K>): Promise<void>;
}
