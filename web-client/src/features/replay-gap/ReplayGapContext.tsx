import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/libs/auth';
import { fetchChartsPatientList, fetchPatientVisits } from '@/features/charts/api/patient-visit-api';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';
import { sendReplayGapAudit, type ReplayGapAuditPayload, type ReplayGapAuditPlatform } from '@/features/replay-gap/replayGapAudit';
import {
  replayGapInitialState,
  useReplayGapController,
  type ReplayGapPhase,
  type ReplayGapReloadMode,
  type ReplayGapState,
} from '@/features/replay-gap/useReplayGapController';

interface ParsedSseEvent {
  id?: string;
  event?: string;
  data?: string;
}

const RUNBOOK_URL =
  'https://intra.opendolphin.jp/docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL#6-chart-eventsreplay-gap-%E5%8F%97%E4%BF%A1%E6%99%82%E3%81%AE%E3%83%AA%E3%83%AD%E3%83%BC%E3%83%89-ux';
const SUPPORT_EMAIL = 'ops@dolphin.example.jp';

const resolveApiBase = () => {
  const base = import.meta.env.VITE_API_BASE_URL ?? '/api';
  return base.replace(/\/$/, '');
};

const chartEventsEndpoint = `${resolveApiBase()}/chart-events`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseSseMessage = (chunk: string): ParsedSseEvent | null => {
  if (!chunk.trim()) {
    return null;
  }
  const lines = chunk.split('\n');
  const message: ParsedSseEvent = {};
  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }
    const [field, ...rest] = line.split(':');
    const value = rest.join(':').trimStart();
    if (!field) {
      continue;
    }
    if (field === 'event') {
      message.event = value;
    } else if (field === 'data') {
      message.data = message.data ? `${message.data}\n${value}` : value;
    } else if (field === 'id') {
      message.id = value;
    }
  }
  if (!message.event && !message.data && !message.id) {
    return null;
  }
  return message;
};

const readEventStream = async (
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  onMessage: (event: ParsedSseEvent) => void,
) => {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      }
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = parseSseMessage(chunk);
        if (event) {
          onMessage(event);
        }
        boundary = buffer.indexOf('\n\n');
      }
      if (signal.aborted) {
        break;
      }
    }
    if (buffer) {
      const event = parseSseMessage(buffer);
      if (event) {
        onMessage(event);
      }
    }
  } finally {
    reader.releaseLock();
  }
};

interface ReplayGapContextValue {
  state: ReplayGapState;
  retry: () => Promise<void>;
  dismiss: () => void;
  runbookHref: string;
  supportHref: string;
  isReloading: boolean;
  showSupportLink: boolean;
}

const ReplayGapContext = createContext<ReplayGapContextValue | null>(null);

export const ReplayGapProvider = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient();
  const { getAuthHeaders, session } = useAuth();
  const { state, markGapDetected, startReload, completeReload, failReload, dismiss } = useReplayGapController();
  const ongoingReloadRef = useRef<Promise<void> | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const gapDetectedAtRef = useRef<string | undefined>(undefined);
  const lastGapSizeRef = useRef<number | undefined>(undefined);

  const sendAudit = useCallback(
    async (mode: ReplayGapReloadMode, status: 'success' | 'failure', errorCode?: number) => {
      const platform: ReplayGapAuditPlatform = (() => {
        if (typeof window === 'undefined') {
          return 'web-client';
        }
        if (window.location.pathname.startsWith('/reception')) {
          return 'web-reception';
        }
        if (window.location.pathname.startsWith('/charts')) {
          return 'web-charts';
        }
        return 'web-client';
      })();

      const gapDurationMs = gapDetectedAtRef.current
        ? Date.now() - new Date(gapDetectedAtRef.current).getTime()
        : undefined;

      const payload: ReplayGapAuditPayload = {
        action: 'replay-gap.reload',
        reason: 'replay-gap',
        origin: 'web-client',
        platform,
        mode,
        status,
        attempts: attemptsRef.current,
        lastEventId: lastEventIdRef.current,
        clientUuid: session?.credentials.clientUuid,
        lastErrorCode: errorCode,
        gapSize: lastGapSizeRef.current,
        gapDetectedAt: gapDetectedAtRef.current,
        recoveredAt: status === 'success' ? new Date().toISOString() : undefined,
        recordedAt: new Date().toISOString(),
        metadata: {
          escalated: attemptsRef.current >= 3,
          gapDurationMs: gapDurationMs && gapDurationMs > 0 ? gapDurationMs : undefined,
        },
      };

      try {
        await sendReplayGapAudit(payload);
      } catch (error) {
        console.error('Replay gap audit を 3 回試行しましたが送信できませんでした。', error);
      }
    },
    [session?.credentials.clientUuid],
  );

  const runReload = useCallback(
    async (mode: ReplayGapReloadMode) => {
      if (ongoingReloadRef.current) {
        return ongoingReloadRef.current;
      }

      const task = (async () => {
        const nextAttempt = state.phase === 'reloading' ? state.attempts : Math.max(state.attempts + 1, 1);
        attemptsRef.current = nextAttempt;
        startReload(mode);
        try {
          const { visits, sequence, gapSize } = await (async () => {
            try {
              return await fetchChartsPatientList({ clientUuid: session?.credentials.clientUuid });
            } catch (error) {
              if (axios.isAxiosError(error) && error.response?.status === 404) {
                const fallbackVisits = await fetchPatientVisits();
                return { visits: fallbackVisits, sequence: undefined, gapSize: undefined };
              }
              throw error;
            }
          })();
          queryClient.setQueryData(patientVisitsQueryKey, visits);
          lastGapSizeRef.current = gapSize;
          if (sequence) {
            lastEventIdRef.current = sequence;
          }
          completeReload();
          await sendAudit(mode, 'success');
        } catch (error) {
          const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
          failReload(statusCode);
          await sendAudit(mode, 'failure', statusCode);
          throw error;
        } finally {
          ongoingReloadRef.current = null;
        }
      })();

      ongoingReloadRef.current = task;
      return task;
    },
    [completeReload, failReload, queryClient, sendAudit, startReload, state.attempts, state.phase],
  );

  const handleReplayGapEvent = useCallback(() => {
    attemptsRef.current = 0;
    gapDetectedAtRef.current = new Date().toISOString();
    markGapDetected();
    void runReload('auto');
  }, [markGapDetected, runReload]);

  useEffect(() => {
    if (typeof window === 'undefined' || !session) {
      return;
    }

    const abortController = new AbortController();

    const connect = async () => {
      while (!abortController.signal.aborted) {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
          break;
        }
        const headers = new Headers({
          Accept: 'text/event-stream',
        });
        for (const [key, value] of Object.entries(authHeaders)) {
          headers.set(key, value);
        }
        if (lastEventIdRef.current) {
          headers.set('Last-Event-ID', lastEventIdRef.current);
        }

        try {
          const response = await fetch(chartEventsEndpoint, {
            method: 'GET',
            headers,
            credentials: 'include',
            signal: abortController.signal,
          });
          if (!response.ok || !response.body) {
            throw new Error(`SSE connection failed with status ${response.status}`);
          }
          await readEventStream(response.body, abortController.signal, (event) => {
            if (event.id) {
              lastEventIdRef.current = event.id;
            }
            if (event.event === 'chart-events.replay-gap') {
              handleReplayGapEvent();
            }
          });
        } catch (error) {
          if (abortController.signal.aborted) {
            break;
          }
          console.warn('SSE 接続に失敗しました。再試行します。', error);
          await wait(3000);
        }
      }
    };

    void connect();

    return () => {
      abortController.abort();
    };
  }, [getAuthHeaders, handleReplayGapEvent, session]);

  const retry = useCallback(() => {
    if (state.phase === 'idle' || state.phase === 'recovered') {
      return Promise.resolve();
    }
    return runReload('manual');
  }, [runReload, state.phase]);

  const value = useMemo<ReplayGapContextValue>(
    () => ({
      state,
      retry,
      dismiss,
      runbookHref: RUNBOOK_URL,
      supportHref: `mailto:${SUPPORT_EMAIL}`,
      isReloading: state.phase === 'reloading',
      showSupportLink: state.attempts >= 3 || state.phase === 'escalated',
    }),
    [dismiss, retry, state],
  );

  return <ReplayGapContext.Provider value={value}>{children}</ReplayGapContext.Provider>;
};

export const useReplayGapContext = () => {
  const context = useContext(ReplayGapContext);
  if (!context) {
    throw new Error('useReplayGapContext は ReplayGapProvider 配下でのみ利用できます。');
  }
  return context;
};
