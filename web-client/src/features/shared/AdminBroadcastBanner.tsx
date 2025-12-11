import type { AdminBroadcast } from '../../libs/admin/broadcast';
import { ToneBanner } from '../reception/components/ToneBanner';

type AdminBroadcastBannerProps = {
  broadcast?: AdminBroadcast | null;
  surface: 'reception' | 'charts';
};

export function AdminBroadcastBanner({ broadcast, surface }: AdminBroadcastBannerProps) {
  if (!broadcast) return null;
  const tone: 'info' | 'warning' = broadcast.queueMode === 'live' && !broadcast.verifyAdminDelivery ? 'warning' : 'info';
  const message = [
    '管理設定が更新されました',
    broadcast.deliveryId ? `deliveryId: ${broadcast.deliveryId}` : undefined,
    broadcast.deliveryVersion ? `version: ${broadcast.deliveryVersion}` : undefined,
    broadcast.queueMode ? `queueMode: ${broadcast.queueMode}` : undefined,
  ]
    .filter(Boolean)
    .join(' ｜ ');
  return (
    <ToneBanner
      tone={tone}
      message={message}
      destination={surface === 'reception' ? 'Reception' : 'Charts'}
      nextAction="再取得/リロードで反映"
      runId={broadcast.runId}
      ariaLive="assertive"
    />
  );
}
