import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAuditActor } from '../../libs/auth/storedAuth';
import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { recordChartsAuditEvent } from './audit';
import type { DataSourceTransition } from './authService';
import type { ClaimQueueEntry } from '../outpatient/types';
import type { ReceptionEntry } from '../reception/api';
import { saveOutpatientPrintPreview } from './print/printPreviewStorage';

type ChartAction = 'finish' | 'send' | 'draft' | 'cancel' | 'print';

type ToastState = {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
  detail?: string;
};

type GuardReason = {
  key:
    | 'missing_master'
    | 'fallback_used'
    | 'config_disabled'
    | 'draft_unsaved'
    | 'permission_denied'
    | 'network_offline'
    | 'network_degraded'
    | 'not_server_route'
    | 'patient_not_selected'
    | 'locked';
  summary: string;
  detail: string;
  next: string[];
};

const ACTION_LABEL: Record<ChartAction, string> = {
  finish: '診療終了',
  send: 'ORCA送信',
  draft: 'ドラフト保存',
  cancel: 'キャンセル',
  print: '印刷',
};

export interface ChartsActionBarProps {
  runId: string;
  traceId?: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed?: boolean;
  selectedEntry?: ReceptionEntry;
  sendEnabled?: boolean;
  sendDisabledReason?: string;
  patientId?: string;
  queueEntry?: ClaimQueueEntry;
  hasUnsavedDraft?: boolean;
  hasPermission?: boolean;
  requireServerRouteForSend?: boolean;
  requirePatientForSend?: boolean;
  networkDegradedReason?: string;
  editLock?: {
    readOnly: boolean;
    reason?: string;
    ownerRunId?: string;
    expiresAt?: string;
  };
  onReloadLatest?: () => void | Promise<void>;
  onDiscardChanges?: () => void;
  onForceTakeover?: () => void;
  onAfterSend?: () => void | Promise<void>;
  onDraftSaved?: () => void;
  onLockChange?: (locked: boolean, reason?: string) => void;
}

export function ChartsActionBar({
  runId,
  traceId,
  cacheHit,
  missingMaster,
  dataSourceTransition,
  fallbackUsed = false,
  selectedEntry,
  sendEnabled = true,
  sendDisabledReason,
  patientId,
  queueEntry,
  hasUnsavedDraft = false,
  hasPermission = true,
  requireServerRouteForSend = false,
  requirePatientForSend = false,
  networkDegradedReason,
  editLock,
  onReloadLatest,
  onDiscardChanges,
  onForceTakeover,
  onAfterSend,
  onDraftSaved,
  onLockChange,
}: ChartsActionBarProps) {
  const navigate = useNavigate();
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [retryAction, setRetryAction] = useState<ChartAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<ChartAction | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uiLocked = lockReason !== null;
  const readOnly = editLock?.readOnly === true;
  const readOnlyReason = editLock?.reason ?? '並行編集を検知したため、このタブは閲覧専用です。';
  const isLocked = uiLocked || isRunning || readOnly;
  const resolvedTraceId = traceId ?? getObservabilityMeta().traceId;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sendPrecheckReasons: GuardReason[] = useMemo(() => {
    const reasons: GuardReason[] = [];

    if (!sendEnabled) {
      reasons.push({
        key: 'config_disabled',
        summary: '管理配信で送信停止',
        detail: sendDisabledReason ?? '管理配信により ORCA 送信が無効化されています。',
        next: ['Administration で再配信', '設定を再取得して反映を確認'],
      });
    }

    if (uiLocked) {
      reasons.push({
        key: 'locked',
        summary: '他の操作が進行中/ロック中',
        detail: lockReason ? lockReason : '別アクション実行中のため送信できません。',
        next: ['ロック解除', '処理完了を待って再試行'],
      });
    }

    if (readOnly) {
      reasons.push({
        key: 'locked',
        summary: '閲覧専用（並行編集）',
        detail: readOnlyReason,
        next: ['最新を再読込', '別タブを閉じる', '必要ならロック引き継ぎ（強制）'],
      });
    }

    if (requirePatientForSend && !patientId) {
      reasons.push({
        key: 'patient_not_selected',
        summary: '患者未選択',
        detail: '患者が未選択のため送信先が確定できません。',
        next: ['Patients で患者を選択', 'Reception へ戻って対象患者を確定'],
      });
    }

    if (requireServerRouteForSend && dataSourceTransition !== 'server') {
      reasons.push({
        key: 'not_server_route',
        summary: 'server ルートではない',
        detail: `dataSourceTransition=${dataSourceTransition} のため ORCA 送信を停止します。`,
        next: ['server route に切替（MSW OFF / 実 API）', 'Reception で再取得'],
      });
    }

    if (missingMaster) {
      reasons.push({
        key: 'missing_master',
        summary: 'missingMaster=true',
        detail: 'マスタ欠損を検知したため、送信は実施できません。',
        next: ['Reception で master を再取得', '再取得完了後に ORCA再送'],
      });
    }

    if (fallbackUsed) {
      reasons.push({
        key: 'fallback_used',
        summary: 'fallbackUsed=true',
        detail: 'フォールバック経路のため、送信は実施できません。',
        next: ['Reception で再取得', 'master 解消後に再送'],
      });
    }

    if (hasUnsavedDraft) {
      reasons.push({
        key: 'draft_unsaved',
        summary: '未保存ドラフト',
        detail: '未保存の入力があるため、送信前にドラフト保存が必要です。',
        next: ['ドラフト保存', '不要なら入力を戻してから再送'],
      });
    }

    if (!isOnline) {
      reasons.push({
        key: 'network_offline',
        summary: '通信オフライン',
        detail: 'ブラウザが offline 状態のため送信できません。',
        next: ['通信回復を待つ', '回線/プロキシ設定を確認'],
      });
    }

    if (networkDegradedReason) {
      reasons.push({
        key: 'network_degraded',
        summary: '通信不安定',
        detail: networkDegradedReason,
        next: ['再取得してから再送', 'Reception へ戻って状態確認'],
      });
    }

    if (permissionDenied || !hasPermission) {
      reasons.push({
        key: 'permission_denied',
        summary: '権限不足/認証不備',
        detail: permissionDenied
          ? '直近の送信で 401/403 を検知しました。'
          : '認証情報が揃っていないため送信を停止します。',
        next: ['再ログイン', '設定確認（facilityId/userId/password）'],
      });
    }

    return reasons;
  }, [
    dataSourceTransition,
    fallbackUsed,
    hasPermission,
    hasUnsavedDraft,
    isOnline,
    lockReason,
    missingMaster,
    networkDegradedReason,
    patientId,
    permissionDenied,
    readOnly,
    readOnlyReason,
    requireServerRouteForSend,
    requirePatientForSend,
    sendDisabledReason,
    sendEnabled,
    uiLocked,
  ]);

  const sendDisabled = isRunning || sendPrecheckReasons.length > 0;
  const otherBlocked = isLocked;

  useEffect(() => {
    onLockChange?.(isLocked, lockReason ?? undefined);
  }, [isLocked, lockReason, onLockChange]);

  const statusLine = useMemo(() => {
    if (isRunning && runningAction) {
      return `${ACTION_LABEL[runningAction]}を実行中… dataSourceTransition=${dataSourceTransition}`;
    }
    if (lockReason) return lockReason;
    if (readOnly) return readOnlyReason;
    if (sendPrecheckReasons.length > 0) {
      const head = sendPrecheckReasons[0];
      return `送信不可: ${head.summary}（runId=${runId} / traceId=${resolvedTraceId ?? 'unknown'}）`;
    }
    return 'アクションを選択できます';
  }, [dataSourceTransition, isRunning, lockReason, readOnly, readOnlyReason, resolvedTraceId, runId, runningAction, sendPrecheckReasons]);

  const logTelemetry = (action: ChartAction, outcome: 'success' | 'error' | 'blocked' | 'started', durationMs?: number, note?: string) => {
    recordOutpatientFunnel('charts_action', {
      action,
      outcome,
      durationMs,
      note,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      runId,
    });
  };

  const logAudit = (
    action: ChartAction,
    outcome: 'success' | 'error' | 'blocked' | 'started',
    detail?: string,
    durationMs?: number,
  ) => {
    const actionMap: Record<ChartAction, 'ENCOUNTER_CLOSE' | 'ORCA_SEND' | 'DRAFT_SAVE' | 'DRAFT_CANCEL' | 'PRINT_OUTPATIENT'> = {
      finish: 'ENCOUNTER_CLOSE',
      send: 'ORCA_SEND',
      draft: 'DRAFT_SAVE',
      cancel: 'DRAFT_CANCEL',
      print: 'PRINT_OUTPATIENT',
    };
    const normalizedAction = outcome === 'error' ? 'CHARTS_ACTION_FAILURE' : actionMap[action];
    recordChartsAuditEvent({
      action: normalizedAction,
      outcome,
      subject: `charts-action-${action}`,
      note: detail,
      error: outcome === 'error' ? detail : undefined,
      durationMs,
      dataSourceTransition,
      cacheHit,
      missingMaster,
      fallbackUsed,
      runId,
    });
  };

  const handleAction = async (action: ChartAction) => {
    if (isRunning) return;

    if (readOnly) {
      const blockedReason = readOnlyReason;
      setToast({
        tone: 'warning',
        message: `${ACTION_LABEL[action]}を停止`,
        detail: blockedReason,
      });
      setRetryAction(null);
      logTelemetry(action, 'blocked', undefined, blockedReason);
      logUiState({
        action:
          action === 'draft'
            ? 'draft'
            : action === 'finish'
              ? 'finish'
              : action === 'cancel'
                ? 'cancel'
                : action === 'print'
                  ? 'print'
                  : 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: { blocked: true, reasons: ['edit_lock_conflict'], traceId: resolvedTraceId, editLock: editLock ?? null },
      });
      logAudit(action, 'blocked', blockedReason);
      return;
    }

    if (action === 'send' && sendPrecheckReasons.length > 0) {
      const blockedReason = sendPrecheckReasons
        .map((reason) => `${reason.summary}: ${reason.detail}`)
        .join(' / ');
      setToast({
        tone: 'warning',
        message: 'ORCA送信を停止',
        detail: blockedReason,
      });
      setRetryAction(null);
      logTelemetry(action, 'blocked', undefined, blockedReason);
      logUiState({
        action: 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: { blocked: true, reasons: sendPrecheckReasons.map((reason) => reason.key), traceId: resolvedTraceId },
      });
      logAudit(action, 'blocked', blockedReason);
      return;
    }

    if (action === 'send' && !patientId) {
      const blockedReason = '患者IDが未確定のため ORCA 送信を実行できません。Patients で患者を選択してください。';
      setToast({ tone: 'warning', message: 'ORCA送信を停止', detail: blockedReason });
      setRetryAction(null);
      logTelemetry(action, 'blocked', undefined, blockedReason);
      logUiState({
        action: 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: { blocked: true, reasons: ['patient_not_selected'], traceId: resolvedTraceId },
      });
      logAudit(action, 'blocked', blockedReason);
      return;
    }

    if (action === 'send' && (fallbackUsed || missingMaster)) {
      setToast({
        tone: 'warning',
        message: '送信前チェック',
        detail: missingMaster
          ? 'missingMaster=true を検知しました。Reception で master を再取得してから再送してください。'
          : 'fallbackUsed=true を検知しました。master 解消後に再送してください。',
      });
    }

    const startedAt = performance.now();
    setIsRunning(true);
    setRunningAction(action);
    setRetryAction(null);
    setToast({
      tone: 'info',
      message: `${ACTION_LABEL[action]}を実行中…`,
      detail: `runId=${runId} / traceId=${resolvedTraceId ?? 'unknown'} / dataSourceTransition=${dataSourceTransition}`,
    });

    logUiState({
      action:
        action === 'draft'
          ? 'draft'
          : action === 'finish'
            ? 'finish'
            : action === 'cancel'
              ? 'cancel'
              : action === 'print'
                ? 'print'
                : 'send',
      screen: 'charts/action-bar',
      controlId: `action-${action}`,
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        patientId,
        appointmentId: queueEntry?.appointmentId,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
      },
    });
    logTelemetry(action, 'started');
    logAudit(action, 'started', undefined);

    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (action === 'send') {
        const endpoint = `/api/orca/queue?patientId=${encodeURIComponent(patientId ?? '')}&retry=1`;
        const response = await httpFetch(endpoint, { method: 'GET', signal });
        if (response.status === 401 || response.status === 403) {
          setPermissionDenied(true);
          throw new Error(`権限不足（HTTP ${response.status}）。再ログインまたは権限設定を確認してください。`);
        }
        if (!response.ok) {
          const bodyText = await response.text().catch(() => '');
          throw new Error(`ORCA 送信 API に失敗（HTTP ${response.status}）。${bodyText ? `response=${bodyText.slice(0, 120)}` : ''}`);
        }
        // 応答ボディは環境差があるため、ここでは成功判定のみ行い、詳細は claim/outpatient 再取得で確認する。
        await response.json().catch(() => ({}));
        await onAfterSend?.();
      } else if (action === 'draft') {
        // TODO: 本実装では localStorage / server に保存。現段階は送信前チェック用のガード連携を優先。
        onDraftSaved?.();
      } else {
        // finish/cancel/print は現状デモ（監査・テレメトリの記録）として扱う。
      }

      const durationMs = Math.round(performance.now() - startedAt);
      const after = getObservabilityMeta();
      const nextRunId = after.runId ?? runId;
      const nextTraceId = after.traceId ?? resolvedTraceId;
      setToast({
        tone: 'success',
        message: `${ACTION_LABEL[action]}を完了`,
        detail: `runId=${nextRunId} / traceId=${nextTraceId ?? 'unknown'} / requestId=${queueEntry?.requestId ?? 'unknown'} / transition=${dataSourceTransition}`,
      });
      logTelemetry(action, 'success', durationMs);
      logAudit(action, 'success', undefined, durationMs);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const isAbort =
        error instanceof DOMException
          ? error.name === 'AbortError'
          : error instanceof Error
            ? error.name === 'AbortError'
            : false;
      const durationMs = Math.round(performance.now() - startedAt);
      const after = getObservabilityMeta();
      const errorRunId = after.runId ?? runId;
      const errorTraceId = after.traceId ?? resolvedTraceId;

      if (isAbort) {
        const abortedDetail = 'ユーザー操作により送信を中断しました。通信回復後に再試行できます。';
        setRetryAction('send');
        setToast({
          tone: 'warning',
          message: 'ORCA送信を中断',
          detail: abortedDetail,
        });
        logTelemetry(action, 'blocked', durationMs, abortedDetail);
        logAudit(action, 'blocked', abortedDetail, durationMs);
      } else {
        const nextSteps = (() => {
          if (/HTTP 401|HTTP 403|権限不足/.test(detail)) {
            return '次にやること: 再ログイン / 設定確認（facilityId/userId/password）';
          }
          if (error instanceof TypeError || /Failed to fetch|NetworkError/.test(detail)) {
            return '次にやること: 通信回復を待つ / Reception で再取得 / リトライ';
          }
          return '次にやること: Reception へ戻る / 請求を再取得 / 設定確認';
        })();
        const composedDetail = `${detail}（runId=${errorRunId} / traceId=${errorTraceId ?? 'unknown'} / requestId=${queueEntry?.requestId ?? 'unknown'}）${nextSteps ? ` / ${nextSteps}` : ''}`;
        setRetryAction(action);
        setToast({
          tone: 'error',
          message: `${ACTION_LABEL[action]}に失敗`,
          detail: composedDetail,
        });
        logTelemetry(action, 'error', durationMs, composedDetail);
        logAudit(action, 'error', composedDetail, durationMs);
      }
    } finally {
      abortControllerRef.current = null;
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const handlePrintExport = () => {
    if (!selectedEntry) {
      setToast({ tone: 'warning', message: '患者が未選択です', detail: 'Patients で患者を選択してから出力してください。' });
      logAudit('print', 'blocked', 'no selectedEntry');
      return;
    }

    const { actor, facilityId } = resolveAuditActor();

    const detail = `印刷プレビューを開きました (actor=${actor})`;
    setToast({ tone: 'info', message: '印刷/エクスポートを開きました', detail });

    recordChartsAuditEvent({
      action: 'PRINT_OUTPATIENT',
      outcome: 'started',
      subject: 'outpatient-document-preview',
      note: detail,
      actor,
      patientId: selectedEntry.patientId ?? selectedEntry.id,
      appointmentId: selectedEntry.appointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
    });

    logUiState({
      action: 'print',
      screen: 'charts/action-bar',
      controlId: 'action-print',
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        destination: '/charts/print/outpatient',
        patientId: selectedEntry.patientId ?? selectedEntry.id,
        appointmentId: selectedEntry.appointmentId,
      },
    });

    navigate('/charts/print/outpatient', {
      state: {
        entry: selectedEntry,
        meta: { runId, cacheHit, missingMaster, fallbackUsed, dataSourceTransition },
        actor,
        facilityId,
      },
    });
    saveOutpatientPrintPreview({
      entry: selectedEntry,
      meta: { runId, cacheHit, missingMaster, fallbackUsed, dataSourceTransition },
      actor,
      facilityId,
    });
  };

  const handleUnlock = () => {
    setLockReason(null);
    setToast({
      tone: 'info',
      message: 'UIロックを解除しました',
      detail: '次のアクションを実行できます',
    });
    logUiState({
      action: 'lock',
      screen: 'charts/action-bar',
      controlId: 'unlock',
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: { unlocked: true },
    });
  };

  const handleAbort = () => {
    if (!isRunning) return;
    if (runningAction !== 'send') return;
    abortControllerRef.current?.abort();
  };

  const handleReloadLatest = async () => {
    setToast({
      tone: 'info',
      message: '最新を再読込',
      detail: '最新データを再取得します（取得完了後に編集可否が更新されます）。',
    });
    await onReloadLatest?.();
  };

  const handleDiscard = () => {
    onDiscardChanges?.();
    setToast({
      tone: 'info',
      message: '変更を破棄しました',
      detail: 'ローカルの未保存状態を破棄し、閲覧専用状態の解除を待てます。',
    });
  };

  const handleForceTakeover = () => {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('別タブが保持している編集ロックを引き継ぎますか？（上書きの可能性があります）')
      : false;
    if (!confirmed) return;
    const second = typeof window !== 'undefined'
      ? window.confirm('最終確認: 編集ロックの引き継ぎを実行します。よろしいですか？')
      : false;
    if (!second) return;
    onForceTakeover?.();
  };

  return (
    <section
      className={`charts-actions${isLocked ? ' charts-actions--locked' : ''}`}
      aria-live={readOnly ? 'off' : sendPrecheckReasons.length > 0 ? 'assertive' : 'polite'}
      data-run-id={runId}
    >
      <header className="charts-actions__header">
        <div>
          <p className="charts-actions__kicker">アクションバー / ORCA 送信とドラフト制御</p>
          <h2>診療終了・送信・ドラフト・キャンセル</h2>
          <p className="charts-actions__status" role="status">
            {statusLine}
          </p>
        </div>
        <div className="charts-actions__meta">
          <span className="charts-actions__pill">runId: {runId}</span>
          <span className="charts-actions__pill">traceId: {resolvedTraceId ?? 'unknown'}</span>
          <span className="charts-actions__pill">transition: {dataSourceTransition}</span>
          <span className="charts-actions__pill">missingMaster: {String(missingMaster)}</span>
          <span className="charts-actions__pill">fallbackUsed: {String(fallbackUsed)}</span>
          <span className="charts-actions__pill">draftDirty: {String(hasUnsavedDraft)}</span>
          <span className="charts-actions__pill">
            患者: {selectedEntry?.name ?? '未選択'}（{selectedEntry?.patientId ?? selectedEntry?.appointmentId ?? 'ID不明'}）
          </span>
          <span className="charts-actions__pill">受付ID: {selectedEntry?.receptionId ?? '—'}</span>
          <span className="charts-actions__pill">診療日: {selectedEntry?.visitDate ?? '—'}</span>
          <span className="charts-actions__pill">現在: {selectedEntry?.status ?? '—'}（受付→診療→会計）</span>
        </div>
      </header>

      {readOnly ? (
        <div className="charts-actions__conflict" role="group" aria-label="並行編集（閲覧専用）の対応">
          <div className="charts-actions__conflict-title">
            <strong>並行編集を検知</strong>
            <span className="charts-actions__conflict-meta">
              {editLock?.ownerRunId ? `ownerRunId=${editLock.ownerRunId}` : ''}
              {editLock?.expiresAt ? ` expiresAt=${editLock.expiresAt}` : ''}
            </span>
          </div>
          <p className="charts-actions__conflict-message">{readOnlyReason}</p>
          <div className="charts-actions__conflict-actions">
            <button type="button" className="charts-actions__button charts-actions__button--unlock" onClick={handleReloadLatest}>
              最新を再読込
            </button>
            <button
              type="button"
              className="charts-actions__button charts-actions__button--ghost"
              onClick={handleDiscard}
              disabled={!hasUnsavedDraft}
            >
              自分の変更を破棄
            </button>
            <button type="button" className="charts-actions__button" onClick={handleForceTakeover}>
              強制引き継ぎ
            </button>
          </div>
        </div>
      ) : null}

      <div className="charts-actions__controls" role="group" aria-label="Charts 操作用ボタン">
        <button
          type="button"
          className="charts-actions__button"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('finish')}
        >
          診療終了
        </button>
        <button
          type="button"
          className="charts-actions__button charts-actions__button--primary"
          disabled={sendDisabled}
          onClick={() => handleAction('send')}
          aria-disabled={sendDisabled}
          aria-describedby={!isRunning && sendPrecheckReasons.length > 0 ? 'charts-actions-send-guard' : undefined}
          data-disabled-reason={
            sendDisabled
              ? (isRunning ? 'running' : sendPrecheckReasons.map((reason) => reason.key).join(','))
              : undefined
          }
        >
          ORCA 送信
        </button>
        <button
          type="button"
          className="charts-actions__button"
          disabled={sendDisabled}
          aria-disabled={sendDisabled}
          onClick={handlePrintExport}
          data-disabled-reason={
            sendDisabled
              ? (isRunning ? 'running' : sendPrecheckReasons.map((reason) => reason.key).join(','))
              : undefined
          }
        >
          印刷/エクスポート
        </button>
        <button
          type="button"
          className="charts-actions__button"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('draft')}
        >
          ドラフト保存
        </button>
        <button
          type="button"
          className="charts-actions__button charts-actions__button--ghost"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('cancel')}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="charts-actions__button charts-actions__button--unlock"
          disabled={isRunning || !isLocked}
          onClick={handleUnlock}
        >
          ロック解除
        </button>
      </div>

      {!isRunning && sendPrecheckReasons.length > 0 && (
        <div id="charts-actions-send-guard" className="charts-actions__guard" role="note" aria-live="assertive">
          <strong>送信前チェック: ORCA送信をブロック</strong>
          <ul>
            {sendPrecheckReasons.map((reason) => (
              <li key={reason.key}>
                {reason.summary}: {reason.detail}（次にやること: {reason.next.join(' / ')}）
              </li>
            ))}
          </ul>
        </div>
      )}

      {isRunning && (
        <div className="charts-actions__skeleton" role="status" aria-live="polite">
          <div className="charts-actions__skeleton-bar" />
          <div className="charts-actions__skeleton-bar charts-actions__skeleton-bar--short" />
        </div>
      )}

      {toast && (
        <div
          className={`charts-actions__toast charts-actions__toast--${toast.tone}`}
          role={toast.tone === 'success' ? 'status' : 'alert'}
          aria-live="assertive"
        >
          <div>
            <strong>{toast.message}</strong>
            {toast.detail && <p>{toast.detail}</p>}
          </div>
          {retryAction && toast.tone !== 'success' && (
            <button
              type="button"
              className="charts-actions__retry"
              onClick={() => handleAction(retryAction)}
              disabled={isRunning}
            >
              リトライ
            </button>
          )}
          {isRunning && runningAction === 'send' && (
            <button type="button" className="charts-actions__retry" onClick={handleAbort}>
              送信を中断
            </button>
          )}
        </div>
      )}
    </section>
  );
}
