import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSession } from '../../AppRouter';
import { logAuditEvent } from '../../libs/audit/auditLogger';
import { useAppToast } from '../../libs/ui/appToast';
import { useAuthService } from '../charts/authService';
import {
  CHART_EVENT_REPLAY_GAP_EVENT,
  startChartEventStream,
  type ChartEventStreamMessage,
} from '../../libs/sse/chartEventStream';
import { triggerChartEventReplayRecovery } from './chartEventReplayRecovery';

const formatGapDetail = (message?: ChartEventStreamMessage) => {
  if (!message?.data) return undefined;
  return message.data.length > 120 ? `${message.data.slice(0, 120)}...` : message.data;
};

export function ChartEventStreamBridge() {
  const session = useSession();
  const { flags } = useAuthService();
  const queryClient = useQueryClient();
  const { enqueue } = useAppToast();
  const recoveryInFlight = useRef(false);
  const mswEnabled = import.meta.env.VITE_DISABLE_MSW !== '1';

  const handleReplayGap = useCallback(
    async (message: ChartEventStreamMessage) => {
      if (recoveryInFlight.current) return;
      recoveryInFlight.current = true;

      logAuditEvent({
        runId: flags.runId,
        source: 'chart-events',
        note: 'replay-gap',
        payload: {
          action: 'chart-events.replay-gap',
          reason: 'replay-gap',
          details: {
            event: message.event ?? CHART_EVENT_REPLAY_GAP_EVENT,
            facilityId: session.facilityId,
            data: message.data,
          },
        },
      });

      enqueue({
        tone: 'warning',
        message: '通知履歴の欠損を検知したため再同期を開始しました。',
        detail: '更新が反映されない場合は画面をリロードしてください。',
      });

      try {
        const result = await triggerChartEventReplayRecovery(queryClient);
        if (result.failures.length > 0) {
          enqueue({
            tone: 'error',
            message: '再同期の一部が失敗しました。',
            detail: formatGapDetail(message) ?? '画面をリロードして最新状態を確認してください。',
          });
        }
      } catch (error) {
        enqueue({
          tone: 'error',
          message: '再同期に失敗しました。',
          detail: error instanceof Error ? error.message : '画面をリロードして最新状態を確認してください。',
        });
      } finally {
        recoveryInFlight.current = false;
      }
    },
    [enqueue, flags.runId, queryClient, session.facilityId],
  );

  useEffect(() => {
    const stop = startChartEventStream({
      facilityId: session.facilityId,
      clientUuid: session.clientUuid,
      onReplayGap: handleReplayGap,
      onError: (error) => {
        if (error.message === 'clientUUID is missing') {
          enqueue({
            tone: 'warning',
            message: 'チャートイベントの再接続に必要な clientUUID が未取得です。',
            detail: '再ログイン後にストリームを再試行してください。',
          });
          return;
        }
        if (/chart-events stream unavailable/i.test(error.message) && (mswEnabled || import.meta.env.DEV)) {
          return;
        }
        const isNetworkError = /network error|failed to fetch|load failed/i.test(error.message);
        if (isNetworkError && (mswEnabled || import.meta.env.DEV)) {
          return;
        }
        // 通知スパムを避けるため、接続エラーは console のみに留める。
        if (typeof console !== 'undefined') {
          console.warn('[chart-events] stream error', error);
        }
      },
    });

    return () => stop();
  }, [enqueue, handleReplayGap, session.clientUuid, session.facilityId]);

  return null;
}
