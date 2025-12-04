import type { BannerTone } from '../../features/reception/components/ToneBanner';
import type { DataSourceTransition } from '../../features/charts/authService';

export type ChartTone = BannerTone;

export type ChartTonePayload = {
  missingMaster: boolean;
  cacheHit: boolean;
  dataSourceTransition: DataSourceTransition;
};

export function computeChartTone({ missingMaster, cacheHit, dataSourceTransition }: ChartTonePayload): ChartTone {
  if (missingMaster) {
    return dataSourceTransition === 'fallback' ? 'error' : 'warning';
  }
  if (cacheHit) {
    return 'info';
  }
  if (dataSourceTransition === 'server') {
    return 'warning';
  }
  return 'info';
}

export interface TransitionMeta {
  label: string;
  tone: BannerTone;
  description: string;
}

const TRANSITION_META: Record<DataSourceTransition, TransitionMeta> = {
  mock: {
    label: 'dataSourceTransition=mock',
    tone: 'info',
    description: '仮想データ／Reproduction fixtures で処理中です。',
  },
  snapshot: {
    label: 'dataSourceTransition=snapshot',
    tone: 'warning',
    description: 'スナップショットキャッシュから取得しています。missingMaster に注意。',
  },
  server: {
    label: 'dataSourceTransition=server',
    tone: 'warning',
    description: '実 ORCA サーバーからマスターデータを取得中。tone=server を継続します。',
  },
  fallback: {
    label: 'dataSourceTransition=fallback',
    tone: 'error',
    description: 'フォールバックデータを利用中。早急に監査と再取得をお願いします。',
  },
};

export function getTransitionMeta(transition: DataSourceTransition): TransitionMeta {
  return TRANSITION_META[transition];
}

export function isServerTransition(transition: DataSourceTransition) {
  return transition === 'server';
}
