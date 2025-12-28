import type { AdminBroadcast, AdminDeliveryFlagState, AdminDeliveryStatus } from '../../libs/admin/broadcast';
import { ToneBanner } from '../reception/components/ToneBanner';

type AdminBroadcastBannerProps = {
  broadcast?: AdminBroadcast | null;
  surface: 'reception' | 'charts';
};

const formatTimestamp = (iso?: string) => {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ja-JP', { hour12: false });
};

const deliveryStateShortLabel = (state?: AdminDeliveryFlagState) => {
  if (state === 'applied') return '反映';
  if (state === 'pending') return '未反映';
  if (state === 'unknown') return '不明';
  return undefined;
};

const summarizeDeliveryStatus = (status?: AdminDeliveryStatus) => {
  if (!status) return { summary: undefined, hasPending: false, parts: [] as string[] };
  const parts = [
    status.chartsDisplayEnabled ? `D:${deliveryStateShortLabel(status.chartsDisplayEnabled)}` : undefined,
    status.chartsSendEnabled ? `S:${deliveryStateShortLabel(status.chartsSendEnabled)}` : undefined,
    status.chartsMasterSource ? `M:${deliveryStateShortLabel(status.chartsMasterSource)}` : undefined,
  ].filter(Boolean) as string[];
  const states = Object.values(status).filter(Boolean) as AdminDeliveryFlagState[];
  const hasPending = states.some((state) => state === 'pending');
  const hasApplied = states.some((state) => state === 'applied');
  const hasUnknown = states.some((state) => state === 'unknown');
  const summary = hasPending ? '未反映' : hasApplied ? '反映' : hasUnknown ? '不明' : undefined;
  return { summary, hasPending, parts };
};

export function AdminBroadcastBanner({ broadcast, surface }: AdminBroadcastBannerProps) {
  if (!broadcast) return null;
  const isQueueBroadcast = broadcast.action === 'queue' || !!broadcast.queueOperation;
  const hasChartsImpact =
    broadcast.chartsMasterSource === 'fallback' ||
    broadcast.chartsDisplayEnabled === false ||
    broadcast.chartsSendEnabled === false;
  const deliveryStatusSummary = summarizeDeliveryStatus(broadcast.deliveryStatus);
  const queueHasRisk =
    broadcast.queueStatus ? broadcast.queueStatus.failed > 0 || broadcast.queueStatus.delayed > 0 : false;
  const tone: 'info' | 'warning' = isQueueBroadcast
    ? broadcast.queueResult === 'failure' || queueHasRisk
      ? 'warning'
      : 'info'
    : hasChartsImpact ||
        deliveryStatusSummary.hasPending ||
        (broadcast.queueMode === 'live' && !broadcast.verifyAdminDelivery)
      ? 'warning'
      : 'info';
  const queueOperationLabel =
    broadcast.queueOperation === 'retry' ? '再送' : broadcast.queueOperation === 'discard' ? '破棄' : undefined;
  const queueResultLabel =
    broadcast.queueResult === 'failure' ? '失敗' : broadcast.queueResult === 'success' ? '完了' : undefined;
  const queueStatusLabel = broadcast.queueStatus
    ? `queue: 合計${broadcast.queueStatus.total}件 / pending:${broadcast.queueStatus.pending} / failed:${broadcast.queueStatus.failed} / delayed:${broadcast.queueStatus.delayed}`
    : undefined;
  const message = isQueueBroadcast
    ? [
        '配信キュー操作が通知されました',
        queueOperationLabel ? `操作: ${queueOperationLabel}` : undefined,
        queueResultLabel ? `結果: ${queueResultLabel}` : undefined,
        broadcast.queuePatientId ? `patientId: ${broadcast.queuePatientId}` : undefined,
        queueStatusLabel,
        broadcast.environment ? `environment: ${broadcast.environment}` : undefined,
        broadcast.queueMode ? `queueMode: ${broadcast.queueMode}` : undefined,
        broadcast.deliveredAt ? `updatedAt: ${formatTimestamp(broadcast.deliveredAt) ?? broadcast.deliveredAt}` : undefined,
      ]
        .filter(Boolean)
        .join(' ｜ ')
    : [
        '管理設定が更新されました',
        broadcast.environment ? `environment: ${broadcast.environment}` : undefined,
        deliveryStatusSummary.summary
          ? `配信:${deliveryStatusSummary.summary}${deliveryStatusSummary.parts.length ? '（D=表示/S=送信/M=master）' : ''}`
          : undefined,
        broadcast.deliveryId ? `deliveryId: ${broadcast.deliveryId}` : undefined,
        broadcast.deliveryVersion ? `version: ${broadcast.deliveryVersion}` : undefined,
        broadcast.deliveredAt ? `deliveredAt: ${formatTimestamp(broadcast.deliveredAt) ?? broadcast.deliveredAt}` : undefined,
        broadcast.queueMode ? `queueMode: ${broadcast.queueMode}` : undefined,
        broadcast.chartsMasterSource ? `chartsMasterSource: ${broadcast.chartsMasterSource}` : undefined,
        broadcast.chartsSendEnabled === false ? 'chartsSend: disabled' : undefined,
        broadcast.chartsDisplayEnabled === false ? 'chartsDisplay: disabled' : undefined,
        ...deliveryStatusSummary.parts,
      ]
        .filter(Boolean)
        .join(' ｜ ');
  return (
    <ToneBanner
      tone={tone}
      message={message}
      destination={surface === 'reception' ? 'Reception' : 'Charts'}
      nextAction={isQueueBroadcast ? '再取得/キュー更新' : '再取得/リロードで反映'}
      runId={broadcast.runId}
      ariaLive={tone === 'warning' ? 'assertive' : 'polite'}
    />
  );
}
