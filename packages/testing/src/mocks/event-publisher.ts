import { jest } from '@jest/globals';
import { createMock } from '../jest/create-mock';

/**
 * Structural event publisher shape shared by many tests.
 *
 * This intentionally avoids importing workspace event ports or event constants.
 * Domain packages can supply `EventPublisherPort` as the generic parameter while
 * this package remains generic infrastructure.
 */
export interface EventPublisherMockShape {
  publish(event: unknown, options?: unknown): Promise<unknown>;
  publishDirect(event: unknown, options?: unknown): Promise<unknown>;
  publishBatch(events: readonly unknown[], options?: unknown): Promise<unknown>;
  publishWithTransaction(event: unknown, transaction: unknown, options?: unknown): Promise<unknown>;
}

const EVENT_PUBLISHER_METHODS = [
  'publish',
  'publishDirect',
  'publishBatch',
  'publishWithTransaction',
] as const;

/**
 * Creates a generic event publisher mock with the standard publishing methods.
 *
 * Keep event payload fixtures and event type assertions in the owning domain;
 * this helper only provides the reusable mocked transport shape.
 */
export function mockEventPublisher<
  TPublisher extends EventPublisherMockShape = EventPublisherMockShape,
>(): jest.Mocked<TPublisher> {
  return createMock<EventPublisherMockShape>(
    EVENT_PUBLISHER_METHODS,
  ) as unknown as jest.Mocked<TPublisher>;
}
