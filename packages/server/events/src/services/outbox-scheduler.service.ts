import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { QueueNames, JobNames } from '@workspace/constants';
import { QUEUE_SCHEDULER_TOKEN, QueueSchedulerPort } from '@workspace/ports';

/**
 * How often the outbox is drained on a timer.
 *
 * This is a safety net, not the delivery mechanism: EventPublisherService
 * nudges the drain immediately after each publish, so normal latency is
 * milliseconds and this interval only matters for rows the nudge missed
 * (publishWithTransaction, or a nudge lost to a Redis blip). Widening it from
 * 5s cuts idle drain jobs from ~17.3k/day to ~5.8k/day, with the matching
 * Postgres round-trips.
 *
 * Do not widen this without the nudge in place — on its own it sets the floor
 * on realtime latency.
 */
const DRAIN_INTERVAL_MS = 15_000;

/**
 * How often stranded PROCESSING rows are swept back to PENDING. Deliberately
 * far less frequent than the drain — it exists to recover from a worker dying
 * mid-batch, which is a deploy/crash-scale event, not a per-second one.
 */
const REAP_INTERVAL_MS = 300_000; // 5m

/**
 * When the PROCESSED-row prune runs. Daily and off-peak, deliberately ten
 * minutes clear of the 03:30 file cleanup so two bulk deletes don't land on
 * the database together. Timezone is stated explicitly to match the other
 * schedulers rather than relying on Accra happening to be UTC+0.
 */
const PRUNE_CRON = '20 3 * * *';
const PRUNE_TZ = 'UTC';

@Injectable()
export class OutboxSchedulerService implements OnModuleInit {
  private readonly drainSchedulerId = `${QueueNames.OUTBOX_PROCESSOR}:${JobNames.PROCESS_OUTBOX_BATCH}`;
  private readonly reapSchedulerId = `${QueueNames.OUTBOX_PROCESSOR}:reap`;
  private readonly pruneSchedulerId = `${QueueNames.OUTBOX_PROCESSOR}:prune`;

  constructor(@Inject(QUEUE_SCHEDULER_TOKEN) private readonly scheduler: QueueSchedulerPort) {}

  async onModuleInit(): Promise<void> {
    await this.scheduler.upsertRepeatableJob(
      QueueNames.OUTBOX_PROCESSOR,
      JobNames.PROCESS_OUTBOX_BATCH,
      { batchId: 'outbox', mode: 'drain' },
      { every: DRAIN_INTERVAL_MS },
      {
        schedulerId: this.drainSchedulerId,
        replace: true,
      },
    );

    // Second scheduler on the SAME queue and processor — OutboxDispatchService
    // branches on the payload's `mode`. Reusing the queue keeps this free in
    // Railway terms: no extra BullMQ Worker, and therefore no extra blocking
    // Redis connection (each Worker duplicates one).
    await this.scheduler.upsertRepeatableJob(
      QueueNames.OUTBOX_PROCESSOR,
      JobNames.PROCESS_OUTBOX_BATCH,
      { batchId: 'outbox-reap', mode: 'reap' },
      { every: REAP_INTERVAL_MS },
      {
        schedulerId: this.reapSchedulerId,
        replace: true,
      },
    );

    // Retention sweep. Same queue and processor again — a cron pattern rather
    // than an interval so it lands in the quiet hours instead of drifting
    // relative to whenever the worker last restarted.
    await this.scheduler.upsertRepeatableJob(
      QueueNames.OUTBOX_PROCESSOR,
      JobNames.PROCESS_OUTBOX_BATCH,
      { batchId: 'outbox-prune', mode: 'prune' },
      { pattern: PRUNE_CRON, tz: PRUNE_TZ },
      {
        schedulerId: this.pruneSchedulerId,
        replace: true,
      },
    );
  }
}
