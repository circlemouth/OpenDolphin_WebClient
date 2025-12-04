import type { ResolveMasterSource } from './ResolveMasterBadge';
import { CacheHitBadge, MissingMasterBadge } from '../../shared/StatusBadge';

const MASTER_SOURCES: ResolveMasterSource[] = ['mock', 'snapshot', 'server', 'fallback'];

export interface OrderConsoleProps {
  masterSource: ResolveMasterSource;
  missingMaster: boolean;
  cacheHit: boolean;
  missingMasterNote: string;
  runId: string;
  onMasterSourceChange: (value: ResolveMasterSource) => void;
  onToggleMissingMaster: () => void;
  onToggleCacheHit: () => void;
  onMissingMasterNoteChange: (value: string) => void;
}

export function OrderConsole({
  masterSource,
  missingMaster,
  cacheHit,
  missingMasterNote,
  runId,
  onMasterSourceChange,
  onToggleMissingMaster,
  onToggleCacheHit,
  onMissingMasterNoteChange,
}: OrderConsoleProps) {
  return (
    <section className="order-console">
      <div className="order-console__grid" data-run-id={runId}>
        <div className="order-console__status-group">
          <CacheHitBadge cacheHit={cacheHit} runId={runId} />
          <MissingMasterBadge missingMaster={missingMaster} runId={runId} />
        </div>
        <div className="order-console__control-panel">
          <div className="order-console__control">
            <label htmlFor="master-source" className="order-console__label">
              resolveMasterSource
            </label>
            <select
              id="master-source"
              value={masterSource}
              onChange={(event) => onMasterSourceChange(event.target.value as ResolveMasterSource)}
            >
              {MASTER_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          <div className="order-console__control-row">
            <button
              type="button"
              className="order-console__action"
              onClick={onToggleMissingMaster}
            >
              missingMaster を {missingMaster ? 'false に' : 'true に'}
            </button>
            <button
              type="button"
              className="order-console__action"
              onClick={onToggleCacheHit}
            >
              cacheHit を {cacheHit ? 'false に' : 'true に'}
            </button>
          </div>
          <label htmlFor="missing-master-note" className="order-console__label">
            missingMaster コメント
          </label>
          <textarea
            id="missing-master-note"
            value={missingMasterNote}
            onChange={(event) => onMissingMasterNoteChange(event.target.value)}
            placeholder="クロスチェックや再送結果を記録"
            aria-describedby="missing-master-note-description"
          />
          <div
            id="missing-master-note-description"
            className="order-console__note"
            role="status"
            aria-live={missingMaster ? 'assertive' : 'polite'}
          >
            {missingMaster
              ? 'マスタ欠損: ORCA 送信をブロックし tone=server の warning を維持'
              : 'マスタ取得済み: ORCA 送信の再開と cacheHit true の組み合わせを sustain'}
          </div>
        </div>
      </div>
    </section>
  );
}
