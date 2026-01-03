import type { ReceptionEntry } from '../api';
import type { ClaimBundle, ClaimQueueEntry } from '../../outpatient/types';
import type { ExceptionDecision } from '../exceptionLogic';

export type ReceptionExceptionKind = 'unapproved' | 'send_error' | 'delayed';

export type ReceptionExceptionItem = {
  id: string;
  kind: ReceptionExceptionKind;
  detail: string;
  nextAction: string;
  entry: ReceptionEntry;
  bundle?: ClaimBundle;
  queue?: ClaimQueueEntry;
  queueLabel?: string;
  queueDetail?: string;
  paymentLabel?: string;
  chartsUrl?: string;
  reasons?: ExceptionDecision['reasons'];
};

export type ReceptionExceptionCounts = {
  total: number;
  unapproved: number;
  sendError: number;
  delayed: number;
};

export type ReceptionExceptionListProps = {
  items: ReceptionExceptionItem[];
  counts: ReceptionExceptionCounts;
  runId?: string;
  onSelectEntry?: (entry: ReceptionEntry) => void;
  onOpenCharts?: (entry: ReceptionEntry, url?: string) => void;
};

const kindLabel: Record<ReceptionExceptionKind, string> = {
  unapproved: '未承認',
  send_error: '送信エラー',
  delayed: '遅延',
};

export function ReceptionExceptionList({ items, counts, runId, onSelectEntry, onOpenCharts }: ReceptionExceptionListProps) {
  return (
    <section className="reception-exceptions" aria-label="例外一覧" data-run-id={runId}>
      <header className="reception-exceptions__header">
        <div>
          <h2>例外一覧</h2>
          <p>未承認・送信エラー・遅延の対象を優先順に表示します。</p>
        </div>
        <div className="reception-exceptions__counts" aria-label="例外件数">
          <span className="reception-pill">合計 {counts.total}件</span>
          <span className="reception-pill">未承認 {counts.unapproved}件</span>
          <span className="reception-pill">送信エラー {counts.sendError}件</span>
          <span className="reception-pill">遅延 {counts.delayed}件</span>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="reception-exceptions__empty" role="status" aria-live="polite">
          現在の条件では例外は検出されていません。
        </p>
      ) : (
        <div className="reception-exceptions__list" role="list">
          {items.map((item) => {
            const canOpenCharts = Boolean(item.entry.patientId);
            return (
            <article key={item.id} className={`reception-exception reception-exception--${item.kind}`} role="listitem">
              <div className="reception-exception__head">
                <span className={`reception-exception__badge reception-exception__badge--${item.kind}`}>{kindLabel[item.kind]}</span>
                <div className="reception-exception__patient">
                  <strong>{item.entry.name ?? '氏名未登録'}</strong>
                  <small>
                    患者ID {item.entry.patientId ?? '未登録'} / 予約ID {item.entry.appointmentId ?? '—'} / 受付ID{' '}
                    {item.entry.receptionId ?? '—'}
                  </small>
                </div>
              </div>
              <div className="reception-exception__meta">
                <span>状態: {item.entry.status ?? '—'}</span>
                <span>支払: {item.paymentLabel ?? '不明'}</span>
                <span>請求: {item.bundle?.claimStatus ?? item.bundle?.claimStatusText ?? '未取得'}</span>
                <span>
                  ORCA: {item.queueLabel ?? '未取得'}
                  {item.queueDetail ? ` (${item.queueDetail})` : ''}
                </span>
              </div>
              <div className="reception-exception__detail">
                <strong>理由</strong>
                <p title={item.detail}>{item.detail}</p>
              </div>
              <div className="reception-exception__actions" role="group" aria-label="例外対応">
                <button type="button" onClick={() => onSelectEntry?.(item.entry)}>
                  一覧で選択
                </button>
                <button
                  type="button"
                  onClick={() => onOpenCharts?.(item.entry, item.chartsUrl)}
                  disabled={!canOpenCharts}
                  title={canOpenCharts ? 'Charts を新規タブで開く' : '患者IDが未登録のため新規タブを開けません'}
                >
                  Charts を新規タブで開く
                </button>
                <span className="reception-exception__next">次アクション: {item.nextAction}</span>
              </div>
            </article>
          );
          })}
        </div>
      )}
    </section>
  );
}
