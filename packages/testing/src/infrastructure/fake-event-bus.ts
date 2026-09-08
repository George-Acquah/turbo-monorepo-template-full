export interface PublishedEvent<TEvent> {
  readonly event: TEvent;
  readonly publishedAt: Date;
}

export class FakeEventBus<TEvent> {
  private readonly events: PublishedEvent<TEvent>[] = [];

  publish(event: TEvent): void {
    this.events.push({ event, publishedAt: new Date() });
  }

  publishMany(events: readonly TEvent[]): void {
    for (const event of events) {
      this.publish(event);
    }
  }

  get published(): readonly PublishedEvent<TEvent>[] {
    return this.events;
  }

  get payloads(): readonly TEvent[] {
    return this.events.map(({ event }) => event);
  }

  findBy(predicate: (event: TEvent) => boolean): TEvent | undefined {
    return this.payloads.find(predicate);
  }

  filterBy(predicate: (event: TEvent) => boolean): TEvent[] {
    return this.payloads.filter(predicate);
  }

  clear(): void {
    this.events.length = 0;
  }
}
