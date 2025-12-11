import { useEffect, useMemo, useState } from 'react';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import type { DataSourceTransition } from './authService';

type ChartAction = 'finish' | 'send' | 'draft' | 'cancel';

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
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ChartsActionBarProps {
  runId: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed?: boolean;
  onLockChange?: (locked: boolean, reason?: string) => void;
}

export function ChartsActionBar({
  runId,
  cacheHit,
  missingMaster,
  dataSourceTransition,
  fallbackUsed = false,
  onLockChange,
}: ChartsActionBarProps) {
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [retryAction, setRetryAction] = useState<ChartAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<ChartAction | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const isLocked = lockReason !== null || isRunning;
  const sendBlocked = missingMaster || isLocked;
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
    if (fallbackUsed) return 'fallbackUsed=true: スナップショット経由、送信前に master を確認してください';
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

  const logAudit = (action: ChartAction, outcome: 'success' | 'error' | 'blocked', detail?: string) => {
    logAuditEvent({
      runId,
      source: `charts-action-${action}`,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      payload: {
        outcome,
        fallbackUsed,
        detail,
      },
    });
  };

  const handleAction = async (action: ChartAction) => {
    if (isRunning) return;

    const blockedByMissingMaster =
      action === 'send' && missingMaster
        ? 'missingMaster=true のため ORCA 送信をブロックしました。Reception で master を解決してから再送してください。'
        : null;
    if (blockedByMissingMaster) {
      setToast({
        tone: 'warning',
        message: 'ORCA送信を停止',
        detail: blockedByMissingMaster,
      });
      setRetryAction(null);
      logTelemetry(action, 'blocked', undefined, blockedByMissingMaster);
      logUiState({
        action: 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: { blocked: true, reason: 'missingMaster' },
      });
      logAudit(action, 'blocked', blockedByMissingMaster);
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

    try {
      const waitMs = action === 'send' ? 1700 : 1100;
      await sleep(waitMs);

      if (action === 'send' && fallbackUsed) {
        throw new Error('fallbackUsed=true のため ORCA 送信を保留しました');
      }

      setLockReason(`${ACTION_LABEL[action]}完了。UI をロック中`);
      setToast({
        tone: 'success',
        message: `${ACTION_LABEL[action]}を完了`,
        detail: `runId=${runId} / transition=${dataSourceTransition}`,
      });
      const durationMs = Math.round(performance.now() - startedAt);
      logTelemetry(action, 'success', durationMs);
      logAudit(action, 'success');
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
      logAudit(action, 'error', detail);
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
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
        >
          ORCA 送信
        </button>
        <button
          type="button"
          className="charts-actions__button"
          disabled={otherBlocked}
          onClick={() => handleAction('draft')}
        >
          ドラフト保存
        </button>
        <button
          type="button"
          className="charts-actions__button charts-actions__button--ghost"
          disabled={otherBlocked}
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
