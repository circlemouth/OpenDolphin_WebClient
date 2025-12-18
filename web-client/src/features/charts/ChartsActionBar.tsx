import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FocusTrapDialog } from '../../components/modals/FocusTrapDialog';
import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAuditActor } from '../../libs/auth/storedAuth';
import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { ToneBanner, type BannerTone } from '../reception/components/ToneBanner';
import { recordChartsAuditEvent } from './audit';
import type { DataSourceTransition } from './authService';
import type { ClaimQueueEntry } from '../outpatient/types';
import type { ReceptionEntry } from '../reception/api';
import { saveOutpatientPrintPreview } from './print/printPreviewStorage';

type ChartAction = 'finish' | 'send' | 'draft' | 'cancel' | 'print';

type ToastState = {
  tone: 'success';
  message: string;
  detail?: string;
};

type BannerState = {
  tone: BannerTone;
  message: string;
  nextAction?: string;
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
  onAfterSend,
  onDraftSaved,
  onLockChange,
}: ChartsActionBarProps) {
  const navigate = useNavigate();
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [retryAction, setRetryAction] = useState<ChartAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<ChartAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ChartAction | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uiLocked = lockReason !== null;
  const isLocked = uiLocked || isRunning;
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
    if (sendPrecheckReasons.length > 0) {
      const head = sendPrecheckReasons[0];
      return `送信不可: ${head.summary}（runId=${runId} / traceId=${resolvedTraceId ?? 'unknown'}）`;
    }
    return 'アクションを選択できます';
  }, [dataSourceTransition, isRunning, lockReason, resolvedTraceId, runId, runningAction, sendPrecheckReasons]);

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

    if (action === 'send' && sendPrecheckReasons.length > 0) {
      const blockedReason = sendPrecheckReasons
        .map((reason) => `${reason.summary}: ${reason.detail}`)
        .join(' / ');
      setBanner({
        tone: 'warning',
        message: `ORCA送信を停止: ${blockedReason}`,
        nextAction: '送信前チェック（理由）を確認し、必要なら Reception で再取得してください。',
      });
      setRetryAction(null);
      setToast(null);
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
      setBanner({ tone: 'warning', message: `ORCA送信を停止: ${blockedReason}`, nextAction: 'Patients で対象患者を選択してください。' });
      setRetryAction(null);
      setToast(null);
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
      setBanner({
        tone: 'warning',
        message: missingMaster
          ? 'missingMaster=true を検知しました。送信前に master を再取得してください。'
          : 'fallbackUsed=true を検知しました。送信前に master 解消（server route）を確認してください。',
        nextAction: 'Reception で再取得してから再送してください。',
      });
    }

    const startedAt = performance.now();
    setIsRunning(true);
    setRunningAction(action);
    setRetryAction(null);
    setToast(null);

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
      setBanner(null);
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
        setBanner({ tone: 'warning', message: `ORCA送信を中断: ${abortedDetail}`, nextAction: '通信回復後にリトライできます。' });
        setToast(null);
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
        setBanner({ tone: 'error', message: `${ACTION_LABEL[action]}に失敗: ${composedDetail}`, nextAction: nextSteps });
        setToast(null);
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
      setBanner({ tone: 'warning', message: '患者が未選択です。Patients で患者を選択してから出力してください。' });
      setToast(null);
      logAudit('print', 'blocked', 'no selectedEntry');
      return;
    }

    const { actor, facilityId } = resolveAuditActor();

    const detail = `印刷プレビューを開きました (actor=${actor})`;
    setBanner(null);
    setToast({ tone: 'success', message: '印刷/エクスポートを開きました', detail });

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
    setBanner({ tone: 'info', message: 'UIロックを解除しました。次のアクションを実行できます。' });
    setToast(null);
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

  return (
    <section
      className={`charts-actions${isLocked ? ' charts-actions--locked' : ''}`}
      id="charts-actionbar"
      tabIndex={-1}
      data-focus-anchor="true"
      aria-live="off"
      data-run-id={runId}
      data-test-id="charts-actionbar"
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

      <FocusTrapDialog
        open={confirmAction === 'send'}
        role="alertdialog"
        title="ORCA送信の確認"
        description={`現在の患者/受付を ORCA へ送信します。実行後に取り消せない場合があります。（runId=${runId} / transition=${dataSourceTransition}）`}
        onClose={() => setConfirmAction(null)}
        testId="charts-send-dialog"
      >
        <div role="group" aria-label="ORCA送信の確認">
          <button type="button" onClick={() => setConfirmAction(null)}>
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmAction(null);
              void handleAction('send');
            }}
          >
            送信する
          </button>
        </div>
      </FocusTrapDialog>

      <FocusTrapDialog
        open={confirmAction === 'print'}
        role="dialog"
        title="印刷/エクスポートの確認"
        description={`個人情報を含む診療文書を表示します。画面共有/第三者の閲覧に注意してください。（runId=${runId}）`}
        onClose={() => setConfirmAction(null)}
        testId="charts-print-dialog"
      >
        <div role="group" aria-label="印刷/エクスポートの確認">
          <button type="button" onClick={() => setConfirmAction(null)}>
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmAction(null);
              handlePrintExport();
            }}
          >
            開く
          </button>
        </div>
      </FocusTrapDialog>

      {banner && (
        <div className="charts-actions__banner">
          <ToneBanner tone={banner.tone} message={banner.message} nextAction={banner.nextAction} runId={runId} />
          <div className="charts-actions__banner-actions" role="group" aria-label="通知操作">
            {retryAction && !isRunning && (
              <button type="button" className="charts-actions__retry" onClick={() => handleAction(retryAction)}>
                リトライ
              </button>
            )}
            <button type="button" className="charts-actions__retry" onClick={() => setBanner(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {isRunning && runningAction === 'send' && (
        <div className="charts-actions__banner-actions" role="group" aria-label="進行中の操作">
          <button type="button" className="charts-actions__retry" onClick={handleAbort}>
            送信を中断
          </button>
        </div>
      )}

      <div className="charts-actions__controls" role="group" aria-label="Charts 操作用ボタン">
        <button
          type="button"
          id="charts-action-finish"
          className="charts-actions__button"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('finish')}
          aria-keyshortcuts="Alt+E"
        >
          診療終了
        </button>
        <button
          type="button"
          id="charts-action-send"
          className="charts-actions__button charts-actions__button--primary"
          disabled={sendDisabled}
          onClick={() => setConfirmAction('send')}
          aria-disabled={sendDisabled}
          aria-describedby={!isRunning && sendPrecheckReasons.length > 0 ? 'charts-actions-send-guard' : undefined}
          data-disabled-reason={
            sendDisabled
              ? (isRunning ? 'running' : sendPrecheckReasons.map((reason) => reason.key).join(','))
              : undefined
          }
          aria-keyshortcuts="Alt+S"
        >
          ORCA 送信
        </button>
        <button
          type="button"
          id="charts-action-print"
          className="charts-actions__button"
          disabled={sendDisabled}
          aria-disabled={sendDisabled}
          onClick={() => setConfirmAction('print')}
          data-disabled-reason={
            sendDisabled
              ? (isRunning ? 'running' : sendPrecheckReasons.map((reason) => reason.key).join(','))
              : undefined
          }
          aria-keyshortcuts="Alt+I"
        >
          印刷/エクスポート
        </button>
        <button
          type="button"
          id="charts-action-draft"
          className="charts-actions__button"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('draft')}
          aria-keyshortcuts="Shift+Enter"
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
        <div id="charts-actions-send-guard" className="charts-actions__guard" role="note" aria-live="off">
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
          role="status"
          aria-live="polite"
          aria-atomic="false"
        >
          <div>
            <strong>{toast.message}</strong>
            {toast.detail && <p>{toast.detail}</p>}
          </div>
          <button type="button" className="charts-actions__retry" onClick={() => setToast(null)}>
            閉じる
          </button>
        </div>
      )}
    </section>
  );
}
