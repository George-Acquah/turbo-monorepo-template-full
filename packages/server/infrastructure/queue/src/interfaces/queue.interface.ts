/**
 * Queue Configuration Interfaces
 */

import { JobsOptions, RateLimiterOptions } from 'bullmq';

export interface QueueConfig {
  name: string;
  defaultJobOptions?: JobsOptions;
  limiter?: RateLimiterOptions;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
}

export interface QueueModuleOptions {
  connection: RedisConfig;
  queues?: QueueConfig[];
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface JobProgress {
  percentage: number;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

/**
 * Internal token used to share queue configs with the registry/bus.
 * Provided by QueueModule.registerQueues(...)
 */
export const QUEUE_CONFIGS_TOKEN = Symbol('QUEUE_CONFIGS_TOKEN');
