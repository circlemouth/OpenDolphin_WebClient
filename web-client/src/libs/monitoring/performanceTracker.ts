import { recordOperationEvent } from '@/libs/audit';
import type { AuditCategory, AuditSeverity } from '@/libs/audit';

type MetricTreeLeaf<T> = T extends string ? T : T extends Record<string, infer V> ? MetricTreeLeaf<V> : never;

export const PERFORMANCE_METRICS = {
  administration: {
    patientExport: {
      fetchAll: 'administration.patientExport.fetchAll',
      fetchCustom: 'administration.patientExport.fetchCustom',
      countByPrefix: 'administration.patientExport.countByPrefix',
    },
    phr: {
      fetchKeyByPatient: 'administration.phr.fetchKeyByPatient',
      fetchKeyByAccess: 'administration.phr.fetchKeyByAccess',
      upsertKey: 'administration.phr.upsertKey',
      fetchContainer: 'administration.phr.fetchContainer',
      fetchText: 'administration.phr.fetchText',
    },
    users: {
      fetchAll: 'administration.users.fetchAll',
      fetchOne: 'administration.users.fetchOne',
      create: 'administration.users.create',
      update: 'administration.users.update',
      delete: 'administration.users.delete',
      resolveName: 'administration.users.resolveName',
    },
    facility: {
      update: 'administration.facility.update',
      registerAdmin: 'administration.facilityAdmin.register',
    },
    system: {
      activitiesFetch: 'administration.activities.fetch',
      licenseSubmit: 'administration.license.submit',
      cloudZeroMail: 'administration.cloudzero.mail',
      serverInfo: {
        jamri: 'administration.serverInfo.jamri',
        claim: 'administration.serverInfo.claim',
        cloud: 'administration.serverInfo.cloud',
      },
    },
  },
  patients: {
    search: 'patients.search',
    fetchById: 'patients.fetchById',
    create: 'patients.create',
    update: 'patients.update',
  },
  charts: {
    karte: {
      fetch: 'charts.karte.fetch',
    },
    attachments: {
      fetchDocuments: 'charts.attachments.fetchDocuments',
      fetchContent: 'charts.attachments.fetchContent',
    },
    claim: {
      moduleSearch: 'charts.claim.moduleSearch',
      send: 'charts.claim.send',
    },
    diagnosis: {
      fetch: 'charts.diagnosis.fetch',
      create: 'charts.diagnosis.create',
      update: 'charts.diagnosis.update',
      delete: 'charts.diagnosis.delete',
    },
    docInfo: {
      fetchList: 'charts.docinfo.fetchList',
      fetchDocuments: 'charts.docinfo.fetchDocuments',
      updateTitle: 'charts.docinfo.updateTitle',
    },
    document: {
      update: 'charts.document.update',
    },
    freeDocument: {
      fetch: 'charts.freeDocument.fetch',
      save: 'charts.freeDocument.save',
    },
    letters: {
      fetchList: 'charts.letters.fetchList',
      fetchDetail: 'charts.letters.fetchDetail',
      save: 'charts.letters.save',
      delete: 'charts.letters.delete',
    },
    labo: {
      modulesFetch: 'charts.labo.modules.fetch',
      trendFetch: 'charts.labo.trend.fetch',
    },
    observations: {
      fetch: 'charts.observations.fetch',
      create: 'charts.observations.create',
      update: 'charts.observations.update',
      delete: 'charts.observations.delete',
    },
    schema: {
      save: 'charts.schema.save',
    },
  },
  orca: {
    master: {
      search: 'orca.master.search',
    },
  },
  reception: {
    pvtHistory: 'reception.pvtHistory',
    documentStatus: 'reception.documentStatus',
    appointments: {
      fetch: 'reception.appointments.fetch',
      save: 'reception.appointments.save',
    },
    legacy: {
      fetchVisits: 'reception.legacy.fetchVisits',
      registerVisit: 'reception.legacy.registerVisit',
      updateMemo: 'reception.legacy.updateMemo',
    },
  },
  schedule: {
    document: {
      create: 'schedule.document.create',
      delete: 'schedule.document.delete',
    },
    facility: {
      fetch: 'schedule.facility.fetch',
    },
  },
} as const;

type MetricTree = typeof PERFORMANCE_METRICS;

export type PerformanceMetricName = MetricTreeLeaf<MetricTree>;

interface PerformanceMetricConfig {
  category: AuditCategory;
  targetMs: number;
  description: string;
}

const metricConfig = {
  [PERFORMANCE_METRICS.patients.search]: {
    category: 'patient',
    targetMs: 3_000,
    description: '患者検索 API',
  },
  [PERFORMANCE_METRICS.patients.fetchById]: {
    category: 'patient',
    targetMs: 3_000,
    description: '患者詳細取得 API',
  },
  [PERFORMANCE_METRICS.patients.create]: {
    category: 'patient',
    targetMs: 5_000,
    description: '患者登録 API',
  },
  [PERFORMANCE_METRICS.patients.update]: {
    category: 'patient',
    targetMs: 5_000,
    description: '患者更新 API',
  },
  [PERFORMANCE_METRICS.charts.karte.fetch]: {
    category: 'chart',
    targetMs: 4_500,
    description: 'カルテ表示 API',
  },
  [PERFORMANCE_METRICS.charts.attachments.fetchDocuments]: {
    category: 'chart',
    targetMs: 4_000,
    description: '添付文書一覧取得 API',
  },
  [PERFORMANCE_METRICS.charts.attachments.fetchContent]: {
    category: 'chart',
    targetMs: 6_000,
    description: '添付文書データ取得 API',
  },
  [PERFORMANCE_METRICS.charts.claim.moduleSearch]: {
    category: 'chart',
    targetMs: 4_000,
    description: 'レセモジュール検索 API',
  },
  [PERFORMANCE_METRICS.charts.claim.send]: {
    category: 'chart',
    targetMs: 7_000,
    description: 'CLAIM 送信 API',
  },
  [PERFORMANCE_METRICS.charts.diagnosis.fetch]: {
    category: 'chart',
    targetMs: 3_000,
    description: '病名一覧取得 API',
  },
  [PERFORMANCE_METRICS.charts.diagnosis.create]: {
    category: 'chart',
    targetMs: 4_000,
    description: '病名登録 API',
  },
  [PERFORMANCE_METRICS.charts.diagnosis.update]: {
    category: 'chart',
    targetMs: 4_000,
    description: '病名更新 API',
  },
  [PERFORMANCE_METRICS.charts.diagnosis.delete]: {
    category: 'chart',
    targetMs: 4_000,
    description: '病名削除 API',
  },
  [PERFORMANCE_METRICS.charts.docInfo.fetchList]: {
    category: 'chart',
    targetMs: 3_000,
    description: '文書情報一覧取得 API',
  },
  [PERFORMANCE_METRICS.charts.docInfo.fetchDocuments]: {
    category: 'chart',
    targetMs: 4_000,
    description: '文書情報詳細取得 API',
  },
  [PERFORMANCE_METRICS.charts.docInfo.updateTitle]: {
    category: 'chart',
    targetMs: 3_000,
    description: '文書タイトル更新 API',
  },
  [PERFORMANCE_METRICS.charts.document.update]: {
    category: 'chart',
    targetMs: 4_500,
    description: 'カルテ文書更新 API',
  },
  [PERFORMANCE_METRICS.charts.freeDocument.fetch]: {
    category: 'chart',
    targetMs: 3_500,
    description: 'フリーテキスト取得 API',
  },
  [PERFORMANCE_METRICS.charts.freeDocument.save]: {
    category: 'chart',
    targetMs: 5_000,
    description: 'フリーテキスト保存 API',
  },
  [PERFORMANCE_METRICS.charts.letters.fetchList]: {
    category: 'chart',
    targetMs: 3_000,
    description: '診療情報提供書一覧取得 API',
  },
  [PERFORMANCE_METRICS.charts.letters.fetchDetail]: {
    category: 'chart',
    targetMs: 4_000,
    description: '診療情報提供書詳細取得 API',
  },
  [PERFORMANCE_METRICS.charts.letters.save]: {
    category: 'chart',
    targetMs: 5_000,
    description: '診療情報提供書保存 API',
  },
  [PERFORMANCE_METRICS.charts.letters.delete]: {
    category: 'chart',
    targetMs: 4_000,
    description: '診療情報提供書削除 API',
  },
  [PERFORMANCE_METRICS.charts.labo.modulesFetch]: {
    category: 'chart',
    targetMs: 3_500,
    description: '検査モジュール取得 API',
  },
  [PERFORMANCE_METRICS.charts.labo.trendFetch]: {
    category: 'chart',
    targetMs: 4_000,
    description: '検査トレンド取得 API',
  },
  [PERFORMANCE_METRICS.charts.observations.fetch]: {
    category: 'chart',
    targetMs: 3_500,
    description: '観察記録一覧取得 API',
  },
  [PERFORMANCE_METRICS.charts.observations.create]: {
    category: 'chart',
    targetMs: 4_500,
    description: '観察記録登録 API',
  },
  [PERFORMANCE_METRICS.charts.observations.update]: {
    category: 'chart',
    targetMs: 4_500,
    description: '観察記録更新 API',
  },
  [PERFORMANCE_METRICS.charts.observations.delete]: {
    category: 'chart',
    targetMs: 4_000,
    description: '観察記録削除 API',
  },
  [PERFORMANCE_METRICS.charts.schema.save]: {
    category: 'chart',
    targetMs: 5_000,
    description: 'シェーマ保存 API',
  },
  [PERFORMANCE_METRICS.orca.master.search]: {
    category: 'orca',
    targetMs: 4_000,
    description: 'ORCA マスター検索 API',
  },
  [PERFORMANCE_METRICS.reception.pvtHistory]: {
    category: 'reception',
    targetMs: 3_000,
    description: '受付履歴取得 API',
  },
  [PERFORMANCE_METRICS.reception.documentStatus]: {
    category: 'reception',
    targetMs: 3_000,
    description: '仮保存カルテ状況取得 API',
  },
  [PERFORMANCE_METRICS.reception.appointments.fetch]: {
    category: 'reception',
    targetMs: 3_500,
    description: '予約一覧取得 API',
  },
  [PERFORMANCE_METRICS.reception.appointments.save]: {
    category: 'reception',
    targetMs: 4_500,
    description: '予約登録 API',
  },
  [PERFORMANCE_METRICS.reception.legacy.fetchVisits]: {
    category: 'reception',
    targetMs: 4_000,
    description: '旧受付一覧取得 API',
  },
  [PERFORMANCE_METRICS.reception.legacy.registerVisit]: {
    category: 'reception',
    targetMs: 5_000,
    description: '旧受付登録 API',
  },
  [PERFORMANCE_METRICS.reception.legacy.updateMemo]: {
    category: 'reception',
    targetMs: 3_000,
    description: '旧受付メモ更新 API',
  },
  [PERFORMANCE_METRICS.schedule.document.create]: {
    category: 'schedule',
    targetMs: 5_000,
    description: '予約連動カルテ生成 API',
  },
  [PERFORMANCE_METRICS.schedule.document.delete]: {
    category: 'schedule',
    targetMs: 4_000,
    description: '予約連動カルテ削除 API',
  },
  [PERFORMANCE_METRICS.schedule.facility.fetch]: {
    category: 'schedule',
    targetMs: 3_500,
    description: '施設スケジュール取得 API',
  },
  [PERFORMANCE_METRICS.administration.patientExport.fetchAll]: {
    category: 'administration',
    targetMs: 6_000,
    description: '患者エクスポート全件 API',
  },
  [PERFORMANCE_METRICS.administration.patientExport.fetchCustom]: {
    category: 'administration',
    targetMs: 6_000,
    description: '患者エクスポート条件指定 API',
  },
  [PERFORMANCE_METRICS.administration.patientExport.countByPrefix]: {
    category: 'administration',
    targetMs: 3_000,
    description: '患者件数取得 API',
  },
  [PERFORMANCE_METRICS.administration.phr.fetchKeyByPatient]: {
    category: 'administration',
    targetMs: 3_000,
    description: 'PHR キー取得 API（患者番号）',
  },
  [PERFORMANCE_METRICS.administration.phr.fetchKeyByAccess]: {
    category: 'administration',
    targetMs: 3_000,
    description: 'PHR キー取得 API（アクセスコード）',
  },
  [PERFORMANCE_METRICS.administration.phr.upsertKey]: {
    category: 'administration',
    targetMs: 5_000,
    description: 'PHR キー登録・更新 API',
  },
  [PERFORMANCE_METRICS.administration.phr.fetchContainer]: {
    category: 'administration',
    targetMs: 6_000,
    description: 'PHR コンテナ取得 API',
  },
  [PERFORMANCE_METRICS.administration.phr.fetchText]: {
    category: 'administration',
    targetMs: 4_000,
    description: 'PHR テキスト取得 API',
  },
  [PERFORMANCE_METRICS.administration.users.fetchAll]: {
    category: 'administration',
    targetMs: 4_000,
    description: 'ユーザー一覧取得 API',
  },
  [PERFORMANCE_METRICS.administration.users.fetchOne]: {
    category: 'administration',
    targetMs: 3_000,
    description: 'ユーザー詳細取得 API',
  },
  [PERFORMANCE_METRICS.administration.users.create]: {
    category: 'administration',
    targetMs: 5_000,
    description: 'ユーザー登録 API',
  },
  [PERFORMANCE_METRICS.administration.users.update]: {
    category: 'administration',
    targetMs: 5_000,
    description: 'ユーザー更新 API',
  },
  [PERFORMANCE_METRICS.administration.users.delete]: {
    category: 'administration',
    targetMs: 5_000,
    description: 'ユーザー削除 API',
  },
  [PERFORMANCE_METRICS.administration.users.resolveName]: {
    category: 'administration',
    targetMs: 2_000,
    description: 'ユーザー名称解決 API',
  },
  [PERFORMANCE_METRICS.administration.facility.update]: {
    category: 'administration',
    targetMs: 5_000,
    description: '施設情報更新 API',
  },
  [PERFORMANCE_METRICS.administration.facility.registerAdmin]: {
    category: 'administration',
    targetMs: 5_000,
    description: '施設管理者登録 API',
  },
  [PERFORMANCE_METRICS.administration.system.activitiesFetch]: {
    category: 'administration',
    targetMs: 4_000,
    description: '監査イベント取得 API',
  },
  [PERFORMANCE_METRICS.administration.system.licenseSubmit]: {
    category: 'administration',
    targetMs: 8_000,
    description: 'ライセンス申請 API',
  },
  [PERFORMANCE_METRICS.administration.system.cloudZeroMail]: {
    category: 'administration',
    targetMs: 10_000,
    description: 'Cloud Zero メール送信 API',
  },
  [PERFORMANCE_METRICS.administration.system.serverInfo.jamri]: {
    category: 'administration',
    targetMs: 3_000,
    description: 'サーバ情報（JAMRI）取得 API',
  },
  [PERFORMANCE_METRICS.administration.system.serverInfo.claim]: {
    category: 'administration',
    targetMs: 3_000,
    description: 'サーバ情報（CLAIM 接続）取得 API',
  },
  [PERFORMANCE_METRICS.administration.system.serverInfo.cloud]: {
    category: 'administration',
    targetMs: 3_000,
    description: 'サーバ情報（Cloud Zero）取得 API',
  },
} as const satisfies Record<PerformanceMetricName, PerformanceMetricConfig>;
// TODO: Cloud Zero 連携メールの閾値・説明文は実運用で精査する

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
