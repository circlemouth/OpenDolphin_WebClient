import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAuditActor } from '../../libs/auth/storedAuth';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { recordChartsAuditEvent } from './audit';
import type { DataSourceTransition } from './authService';
import type { ReceptionEntry } from '../reception/api';
import { saveOutpatientPrintPreview } from './print/printPreviewStorage';

type ChartAction = 'finish' | 'send' | 'draft' | 'cancel' | 'print';

type ToastState = {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
  detail?: string;
};

const ACTION_LABEL: Record<ChartAction, string> = {
  finish: '診療終了',
  send: 'ORCA送信',
  draft: 'ドラフト保存',
  cancel: 'キャンセル',
  print: '印刷',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ChartsActionBarProps {
  runId: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed?: boolean;
  selectedEntry?: ReceptionEntry;
  onLockChange?: (locked: boolean, reason?: string) => void;
}

export function ChartsActionBar({
  runId,
  cacheHit,
  missingMaster,
  dataSourceTransition,
  fallbackUsed = false,
  selectedEntry,
  onLockChange,
}: ChartsActionBarProps) {
  const navigate = useNavigate();
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [retryAction, setRetryAction] = useState<ChartAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<ChartAction | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const isLocked = lockReason !== null || isRunning;
  const sendBlocked = missingMaster || fallbackUsed || isLocked;
  const otherBlocked = isLocked;

  useEffect(() => {
    onLockChange?.(isLocked, lockReason ?? undefined);
  }, [isLocked, lockReason, onLockChange]);

  const statusLine = useMemo(() => {
    if (isRunning && runningAction) {
      return `${ACTION_LABEL[runningAction]}を実行中… dataSourceTransition=${dataSourceTransition}`;
    }
    if (lockReason) return lockReason;
    if (missingMaster) return 'missingMaster=true: Reception で master を再取得するまで送信を停止中';
    if (fallbackUsed) return 'fallbackUsed=true: スナップショット経由、送信をブロック中';
    return 'アクションを選択できます';
  }, [dataSourceTransition, fallbackUsed, isRunning, lockReason, missingMaster, runningAction]);

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

    const blockedReason =
      action === 'send' && missingMaster
        ? 'missingMaster=true のため ORCA 送信をブロックしました。Reception で master を解決してから再送してください。'
        : action === 'send' && fallbackUsed
          ? 'fallbackUsed=true のため ORCA 送信をブロックしました。master 解消後に再取得してください。'
          : null;
    if (blockedReason) {
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
        details: { blocked: true, reason: missingMaster ? 'missing_master' : 'fallback_used' },
      });
      logAudit(action, 'blocked', blockedReason);
      return;
    }

    if (fallbackUsed) {
      setToast({
        tone: 'warning',
        message: 'fallbackUsed=true を検知',
        detail: 'スナップショット経由のデータです。ORCA 送信は master 解決後に再実行してください。',
      });
    }

    const startedAt = performance.now();
    setIsRunning(true);
    setRunningAction(action);
    setRetryAction(null);
    setErrorDetail(null);
    setToast({
      tone: 'info',
      message: `${ACTION_LABEL[action]}を実行中…`,
      detail: `runId=${runId} / dataSourceTransition=${dataSourceTransition}`,
    });

    logUiState({
      action: action === 'draft' ? 'draft' : action === 'finish' ? 'finish' : action === 'cancel' ? 'cancel' : 'send',
      screen: 'charts/action-bar',
      controlId: `action-${action}`,
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
    });
    logTelemetry(action, 'started');
    logAudit(action, 'started', undefined);

    try {
      const waitMs = action === 'send' ? 1700 : 1100;
      await sleep(waitMs);

      if (action === 'send' && fallbackUsed) {
        throw new Error('fallbackUsed=true のため ORCA 送信を保留しました');
      }

      setLockReason(`${ACTION_LABEL[action]}完了。UI をロック中`);
      const durationMs = Math.round(performance.now() - startedAt);
      setToast({
        tone: 'success',
        message: `${ACTION_LABEL[action]}を完了`,
        detail: `runId=${runId} / transition=${dataSourceTransition}`,
      });
      logTelemetry(action, 'success', durationMs);
      logAudit(action, 'success', undefined, durationMs);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setErrorDetail(detail);
      setRetryAction(action);
      setLockReason(null);
      setToast({
        tone: 'error',
        message: `${ACTION_LABEL[action]}に失敗`,
        detail,
      });
      const durationMs = Math.round(performance.now() - startedAt);
      logTelemetry(action, 'error', durationMs, detail);
      logAudit(action, 'error', detail, durationMs);
    } finally {
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

  return (
    <section
      className={`charts-actions${isLocked ? ' charts-actions--locked' : ''}`}
      aria-live={missingMaster ? 'assertive' : 'polite'}
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
          <span className="charts-actions__pill">transition: {dataSourceTransition}</span>
          <span className="charts-actions__pill">missingMaster: {String(missingMaster)}</span>
          <span className="charts-actions__pill">fallbackUsed: {String(fallbackUsed)}</span>
        </div>
      </header>

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
          disabled={sendBlocked}
          onClick={() => handleAction('send')}
          aria-disabled={sendBlocked}
          aria-describedby={missingMaster ? 'charts-actions-blocked' : undefined}
          data-disabled-reason={
            sendBlocked ? (missingMaster ? 'missing_master' : fallbackUsed ? 'fallback_used' : isLocked ? 'locked' : undefined) : undefined
          }
        >
          ORCA 送信
        </button>
        <button
          type="button"
          className="charts-actions__button"
          disabled={sendBlocked}
          onClick={handlePrintExport}
          aria-disabled={sendBlocked}
          data-disabled-reason={
            sendBlocked ? (missingMaster ? 'missing_master' : fallbackUsed ? 'fallback_used' : isLocked ? 'locked' : undefined) : undefined
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

      {missingMaster && (
        <p id="charts-actions-blocked" className="charts-actions__guard" role="note" aria-live="assertive">
          missingMaster=true のため ORCA 送信を一時停止しています。Reception で master を解決してください。
        </p>
      )}
      {fallbackUsed && !missingMaster && (
        <p className="charts-actions__guard" role="note" aria-live="assertive">
          fallbackUsed=true のため ORCA 送信をブロック中です。マスタ再取得後に再送してください。
        </p>
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
          id={missingMaster ? 'charts-actions-blocked' : undefined}
        >
          <div>
            <strong>{toast.message}</strong>
            {toast.detail && <p>{toast.detail}</p>}
            {errorDetail && <p className="charts-actions__toast-detail">詳細: {errorDetail}</p>}
          </div>
          {retryAction && toast.tone === 'error' && (
            <button
              type="button"
              className="charts-actions__retry"
              onClick={() => handleAction(retryAction)}
              disabled={isRunning}
            >
              リトライ
            </button>
          )}
        </div>
      )}
    </section>
  );
}
