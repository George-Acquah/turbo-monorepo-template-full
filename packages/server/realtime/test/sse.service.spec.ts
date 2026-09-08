import { describe, it, expect, beforeEach } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { firstValueFrom } from 'rxjs';
import type {
  RedisSubscriberClient,
  RedisSubscriberFactory,
  LoggerPort,
} from '@workspace/ports';
import { createMock } from '@workspace/testing/jest';
import { SseService } from '../src/services/sse.service';

class FakeSubscriberClient extends EventEmitter implements RedisSubscriberClient {
  psubscribed: string[] = [];

  async psubscribe(pattern: string): Promise<void> {
    this.psubscribed.push(pattern);
  }

  async quit(): Promise<string> {
    return 'OK';
  }
}

describe('SseService', () => {
  let client: FakeSubscriberClient;
  let service: SseService;

  beforeEach(() => {
    client = new FakeSubscriberClient();
    const factory = createMock<RedisSubscriberFactory>(['create']);
    factory.create.mockReturnValue(client);
    const logger = createMock<Pick<LoggerPort, 'debug'>>(['debug']);

    service = new SseService(
      factory as unknown as RedisSubscriberFactory,
      logger as unknown as LoggerPort,
    );
    service.onModuleInit();
  });

  it('psubscribes to the user-scoped channel pattern', () => {
    expect(client.psubscribed).toEqual(['realtime:user:*']);
  });

  it('routes a pmessage on realtime:user:<id> to that user\'s subscribe() stream', async () => {
    const received = firstValueFrom(service.subscribe('user-123'));

    client.emit('pmessage', 'realtime:user:*', 'realtime:user:user-123', JSON.stringify({ hello: 'world' }));

    const event = await received;
    expect(event.data).toEqual({ hello: 'world' });
  });

  it('does not deliver a message published for a different user', async () => {
    const events: unknown[] = [];
    const sub = service.subscribe('user-123').subscribe((e) => events.push(e));

    client.emit('pmessage', 'realtime:user:*', 'realtime:user:someone-else', JSON.stringify({ x: 1 }));

    // Give the emitter a tick; only 'someone-else' listeners should fire.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(events).toHaveLength(0);
    sub.unsubscribe();
  });
});
