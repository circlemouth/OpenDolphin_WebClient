import { recordOperationEvent } from '@/libs/audit';
import type { AuditCategory, AuditSeverity } from '@/libs/audit';

export type PerformanceMetricName =
  | 'patients.search'
  | 'patients.fetchById'
  | 'patients.create'
  | 'patients.update'
  | 'charts.karte.fetch'
  | 'orca.master.search';

interface PerformanceMetricConfig {
  category: AuditCategory;
  targetMs: number;
  description: string;
}

const metricConfig: Record<PerformanceMetricName, PerformanceMetricConfig> = {
  'patients.search': {
    category: 'patient',
    targetMs: 3_000,
    description: '患者検索レスポンス',
  },
  'patients.fetchById': {
    category: 'patient',
    targetMs: 3_000,
    description: '患者詳細取得レスポンス',
  },
  'patients.create': {
    category: 'patient',
    targetMs: 5_000,
    description: '患者登録レスポンス',
  },
  'patients.update': {
    category: 'patient',
    targetMs: 5_000,
    description: '患者更新レスポンス',
  },
  'charts.karte.fetch': {
    category: 'chart',
    targetMs: 5_000,
    description: 'カルテ描画レスポンス',
  },
  'orca.master.search': {
    category: 'orca',
    targetMs: 3_000,
    description: 'ORCA マスター検索レスポンス',
  },
};

const classifySeverity = (durationMs: number, targetMs: number): AuditSeverity => {
  if (durationMs <= targetMs) {
    return 'info';
  }
  if (durationMs <= targetMs * 1.5) {
    return 'warning';
  }
  return 'critical';
};

export const measureApiPerformance = async <T>(
  metric: PerformanceMetricName,
  action: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> => {
  const config = metricConfig[metric];
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const result = await fn();
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = end - start;
    const severity = classifySeverity(duration, config.targetMs);
    recordOperationEvent(
      config.category,
      severity,
      `performance:${metric}`,
      `${config.description}が ${Math.round(duration)}ms で完了しました`,
      {
        durationMs: duration,
        targetMs: config.targetMs,
        action,
        ...(metadata ?? {}),
      },
    );
    return result;
  } catch (error) {
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = end - start;
    recordOperationEvent(
      config.category,
      'critical',
      `performance:${metric}:error`,
      `${config.description}でエラーが発生しました`,
      {
        durationMs: duration,
        targetMs: config.targetMs,
        action,
        error: error instanceof Error ? error.message : String(error),
        ...(metadata ?? {}),
      },
    );
    throw error;
  }
};
