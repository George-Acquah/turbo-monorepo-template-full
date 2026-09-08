'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeEvent } from '@workspace/client-types';

/** Options accepted by `useRealtimeStream`. */
export interface UseRealtimeStreamOptions<T = unknown> {
  /**
   * Bare origin of apps/api, e.g. `https://api.example.com` — no `/api` suffix,
   * same convention as each app's `env.apiUrl`. apps/members and apps/backoffice
   * call the API cross-origin directly from the browser (see
   * docs/infrastructure/architecture/deployment-topology.md — no proxy/rewrite),
   * so there's no same-origin relative-path fallback; every caller must supply
   * this explicitly.
   */
  apiBaseUrl: string;
  /** Only invoke `onEvent` for these event types.  Omit to receive all events. */
  eventTypes?: string[];
  /** Called with each matching event. */
  onEvent?: (event: RealtimeEvent<T>) => void;
  /** Called when the SSE connection opens. */
  onConnect?: () => void;
  /** Called when the SSE connection closes or errors. */
  onDisconnect?: () => void;
  /** Enable / disable the stream without unmounting the hook. @default true */
  enabled?: boolean;
  /**
   * Milliseconds to wait before the first reconnect attempt.
   * Subsequent delays double up to `maxRetryDelay`.
   * @default 1000
   */
  initialRetryDelay?: number;
  /** @default 30000 */
  maxRetryDelay?: number;
}

export interface UseRealtimeStreamResult<T = unknown> {
  isConnected: boolean;
  lastEvent: RealtimeEvent<T> | null;
}

/**
 * `useRealtimeStream` — subscribes to the workspace SSE endpoint and delivers
 * typed `RealtimeEvent` objects to the caller.
 *
 * The browser's native `EventSource` API can't set custom headers, so this
 * relies on the `app_access_token` cookie being sent automatically —
 * requires the calling app's `COOKIE_DOMAIN` to be set (production only; see
 * that app's shared/lib/cookies.ts) so the cookie reaches apiBaseUrl's origin.
 *
 * Reconnection uses exponential back-off.  The connection is torn down when
 * the component unmounts or when `enabled` is set to `false`.
 *
 * @example
 * ```tsx
 * const { isConnected, lastEvent } = useRealtimeStream<{ programmeId: string }>({
 *   apiBaseUrl: env.apiUrl,
 *   eventTypes: ['workspace.enrolments.enrolment.activated'],
 *   onEvent: (e) => toast.success(`You now have access to ${e.payload.programmeId}`),
 * });
 * ```
 */
export function useRealtimeStream<T = unknown>(
  options: UseRealtimeStreamOptions<T>,
): UseRealtimeStreamResult<T> {
  const {
    apiBaseUrl,
    eventTypes,
    onEvent,
    onConnect,
    onDisconnect,
    enabled = true,
    initialRetryDelay = 1_000,
    maxRetryDelay = 30_000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);

  // Stable refs so effect callbacks always capture the latest values without
  // re-establishing the EventSource connection.
  const onEventRef = useRef(onEvent);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const eventTypesRef = useRef(eventTypes);

  onEventRef.current = onEvent;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  eventTypesRef.current = eventTypes;

  useEffect(() => {
    if (!enabled) return;

    let es: EventSource | null = null;
    let retryDelay = initialRetryDelay;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      es = new EventSource(`${apiBaseUrl.replace(/\/+$/, '')}/api/v1/realtime/stream`, {
        withCredentials: true,
      });

      es.onopen = () => {
        retryDelay = initialRetryDelay; // Reset on successful connect
        setIsConnected(true);
        onConnectRef.current?.();
      };

      es.onmessage = (rawEvent) => {
        let parsed: RealtimeEvent<T>;
        try {
          parsed = JSON.parse(rawEvent.data) as RealtimeEvent<T>;
        } catch {
          return;
        }

        const filter = eventTypesRef.current;
        if (filter && filter.length > 0 && !filter.includes(parsed.eventType)) {
          return;
        }

        setLastEvent(parsed);
        onEventRef.current?.(parsed);
      };

      es.onerror = () => {
        es?.close();
        setIsConnected(false);
        onDisconnectRef.current?.();

        // Exponential back-off before reconnecting
        timeoutId = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, maxRetryDelay);
          connect();
        }, retryDelay);
      };
    };

    connect();

    return () => {
      destroyed = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      es?.close();
      setIsConnected(false);
    };
  }, [apiBaseUrl, enabled, initialRetryDelay, maxRetryDelay]);

  return { isConnected, lastEvent };
}
