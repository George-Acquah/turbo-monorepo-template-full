import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue, Queue } from '@repo/queue';
import { QueueNames, JobNames } from '@repo/constants';
import { QUEUE_SCHEDULER_TOKEN, QueueSchedulerPort } from '@repo/ports';

@Injectable()
export class OutboxSchedulerService implements OnModuleInit {
  private readonly schedulerId = `${QueueNames.OUTBOX_PROCESSOR}:${JobNames.PROCESS_OUTBOX_BATCH}`;

  constructor(
    @InjectQueue(QueueNames.OUTBOX_PROCESSOR) private readonly outboxQueue: Queue,
    @Inject(QUEUE_SCHEDULER_TOKEN) private readonly scheduler: QueueSchedulerPort,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.scheduler.upsertRepeatableJob(
      this.outboxQueue,
      JobNames.PROCESS_OUTBOX_BATCH,
      { batchId: 'outbox' },
      { every: 5000 },
      {
        schedulerId: this.schedulerId,
        replace: true,
      },
    );
  }
}
