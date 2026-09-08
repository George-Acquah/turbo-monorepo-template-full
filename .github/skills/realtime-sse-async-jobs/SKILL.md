---
name: realtime-sse-async-jobs
description: Pattern for tracking background job completion in a client component via an SSE stream, for when this is built in a future workspace app. Not yet implemented anywhere in the repo.
---

# Realtime SSE — Async Job Tracking (forward-looking pattern)

## Status — nothing here exists yet

There is no SSE endpoint, no `useJobStatus` hook, and no client-side job-tracking UI implemented
anywhere in this repo today. `apps/landing` (the only implemented app) has no dashboard or background
job UI. `apps/members` (the future authenticated member portal) and `apps/worker` (background
jobs/async processing) are both still placeholders with no code — see their `CLAUDE.md` files.

This skill describes a **pattern to reach for if/when** a client component in `apps/members` needs to
react to a background job's completion (once `apps/members` and `apps/worker` are scaffolded), using
the real event-publishing building blocks that already exist in `packages/server/events` and
`packages/server/ports`. Treat every code snippet below as illustrative, not as referencing files that
exist today. When `apps/members` is scaffolded it should follow strict FSDD per its `CLAUDE.md` — the
paths below use a generic `features/<feature>/` shape consistent with that, not any specific existing
directory.

Concrete examples of jobs this pattern would suit once the pieces exist: bulk CSV import, report
generation, or any flow that enqueues work via `QueueBusPort` and later publishes a completion domain
event via `EventPublisherPort` (both real ports, from `@workspace/ports`).

---

## How the stack would work end-to-end

```
Server action (POST)
  └─ Service → QueueBusPort.enqueue()      → worker queue (apps/worker, once scaffolded)
  └─ Returns { correlationId, ...initialData }
                                           │
Worker processor (background)             │
  └─ processes job                        │
  └─ EventPublisherPort.publish(event)    │
       └─ event carries correlationId     │
                                          │
SSE endpoint (e.g. GET /api/realtime)     │
  └─ Redis pub/sub listener               │
  └─ pushes matching event to client ─── ┘
                                          │
useJobStatus hook (client component)      │
  └─ subscribes to a shared EventSource   │
  └─ matches correlationId               ◄┘
  └─ transitions status → 'completed' | 'failed'
  └─ returns payload from the SSE event
```

---

## `useJobStatus` hook API (illustrative — does not exist yet)

```typescript
const { status, payload, reset } = useJobStatus<TPayload>({
  correlationId,            // string | null — null keeps hook idle
  completedEventType,       // an event type constant from @workspace/constants
  failedEventType?,         // optional failure event type
  pendingTimeoutMs?,        // e.g. 30_000 ms — transitions to 'failed' on timeout
  onCompleted?,             // (payload: TPayload) => void
  onFailed?,                // (payload: unknown) => void
  onTimeout?,               // () => void
});
```

| Return value | Type                                             | Notes                                                       |
| ------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| `status`     | `'idle' \| 'pending' \| 'completed' \| 'failed'` | Driven by SSE events                                        |
| `payload`    | `TPayload \| null`                               | The event payload — populated when `status === 'completed'` |
| `reset`      | `() => void`                                     | Clears status + payload back to `'idle'`                    |

---

## Required data flow

A server action that triggers a background job would need to return **both**:

| Field                     | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `correlationId`           | Required by `useJobStatus` to match the SSE event                |
| Any initial response data | Displayed while the job is in-flight                              |

The `correlationId` would originate from the service/use-case response and flow through the API
response into whatever action-result shape the app adopts.

---

## Illustrative client-component pattern

```tsx
'use client';

import { useState } from 'react';
import { useJobStatus } from '<path-tbd-when-apps/members-exists>';
import { myJobAction } from '../actions/my-job-action';

// Type of the SSE completion event payload — define alongside the event constant.
type MyJobCompletedPayload = {
  jobId: string;
  successCount: number;
  failedCount: number;
};

const COMPLETED_EVENT = 'domain.entity.job_completed'; // an event-type constant from @workspace/constants

export function MyFeatureComponent() {
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const { status: jobStatus, payload: jobPayload } = useJobStatus<MyJobCompletedPayload>({
    correlationId,
    completedEventType: COMPLETED_EVENT,
    onCompleted: () => setIsDone(true),
    onFailed: () => setIsDone(true),
    pendingTimeoutMs: 60_000,
  });

  const handleSubmit = async (formData: FormData) => {
    const result = await myJobAction(formData);
    if (result.status === 'success') {
      setCorrelationId(result.data.correlationId ?? null);
    }
  };

  if (jobStatus === 'pending') {
    return <div className="h-2 w-full rounded-full bg-primary animate-pulse" />;
  }

  if (isDone) {
    return (
      <p>
        Done: {jobPayload?.successCount ?? 0} succeeded, {jobPayload?.failedCount ?? 0} failed.
      </p>
    );
  }

  return <button onClick={() => handleSubmit(new FormData())}>Start Job</button>;
}
```

---

## What NOT to do (generically true regardless of which app implements this)

### Avoid a GET action/route used purely for polling

Server actions are conventionally POST-only; a dedicated polling GET endpoint duplicates what SSE
already delivers once the SSE stream exists.

### Avoid `setInterval` polling

```typescript
// Avoid — wasted requests once an SSE (or equivalent push) channel delivers completion.
useEffect(() => {
  const id = setInterval(() => fetch(`/api/jobs/${jobId}`), 2000);
  return () => clearInterval(id);
}, [jobId]);
```

---

## How the backend would publish the completion event

The worker processor calls the real `EventPublisherPort.publish()` (from `@workspace/ports`) with the
`correlationId` from the job data so an SSE router could match it to the waiting client:

```typescript
await this.eventPublisher.publish({
  eventType: SomeEvents.JOB_COMPLETED, // from packages/server/constants/src/events/event-type.constants.ts
  correlationId: job.data.correlationId, // required for SSE matching
  payload: { jobId, successCount, failedCount },
});
```

Without `correlationId` on the published event, a `useJobStatus`-style hook would never match and
would time out.

---

## Event type constants

Event type strings should always come from `packages/server/constants/src/events/event-type.constants.ts`
— never raw string literals. Check what's already defined there before adding a new one; there is no
`AcademicsEvents`/`FeeEvents` group in this repo (those were specific to the earlier schools-platform
pivot and don't apply to a trading-mentorship domain).

---

## When you also need a plain data GET (e.g. an error report download)

If a "done" screen needs server-side data not included in the SSE payload, fetch it on demand via a
server-only data-fetching function triggered by an explicit user action (e.g. a download button), not
automatically and not in a polling loop.
