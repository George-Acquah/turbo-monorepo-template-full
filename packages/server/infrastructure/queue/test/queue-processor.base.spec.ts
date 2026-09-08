// import type { Job } from 'bullmq';
// import { QueueProcessor } from '../src/base/queue-processor.base';

// describe('QueueProcessor', () => {
//   class TestProcessor extends QueueProcessor<unknown> {
//     protected readonly logger = {
//       debug: jest.fn(),
//       error: jest.fn(),
//       log: jest.fn(),
//       warn: jest.fn(),
//     } as any;

//     protected async handle(_job: Job<unknown>): Promise<void> {
//       return;
//     }
//   }

//   it('creates tenant-aware request context from job payload', () => {
//     const processor = new TestProcessor('TestProcessor');
//     const job = {
//       id: 'job-1',
//       name: 'test-job',
//       data: {
//         tenant: { tenantId: 'tenant-1', orgId: 'org-1' },
//       },
//     } as unknown as Job<unknown>;

//     const context = (processor as any).createJobContext(job);

//     expect(context).toBeDefined();
//     expect(context?.tenantId).toBe('tenant-1');
//     expect(context?.orgId).toBe('tenant-1');
//     expect(context?.organizationId).toBe('tenant-1');
//   });

//   it('falls back to legacy tenant values when canonical fields are absent', () => {
//     const processor = new TestProcessor('TestProcessor');
//     const job = {
//       id: 'job-2',
//       name: 'test-job',
//       data: {
//         organizationId: 'tenant-legacy',
//       },
//     } as unknown as Job<unknown>;

//     const context = (processor as any).createJobContext(job);

//     expect(context).toBeDefined();
//     expect(context?.tenantId).toBe('tenant-legacy');
//     expect(context?.orgId).toBe('tenant-legacy');
//   });
// });
