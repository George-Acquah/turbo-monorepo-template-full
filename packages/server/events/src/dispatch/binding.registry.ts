// packages/server/events/src/mesh/binding.registry.ts
import { TransportAdapter } from '@/mesh';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BindingRegistry {
  private readonly bindings = new Map<string, TransportAdapter>();

  register(queueName: string, adapter: TransportAdapter): void {
    if (this.bindings.has(queueName)) {
      throw new Error(`Transport already registered for queue "${queueName}"`);
    }
    this.bindings.set(queueName, adapter);
  }

  get(queueName: string): TransportAdapter {
    const adapter = this.bindings.get(queueName);
    if (!adapter) {
      throw new Error(`No transport adapter registered for queue "${queueName}"`);
    }
    return adapter;
  }

  has(queueName: string): boolean {
    return this.bindings.has(queueName);
  }

  list(): string[] {
    return [...this.bindings.keys()];
  }
}
