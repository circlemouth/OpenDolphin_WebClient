import type { BannerTone } from './ToneBanner';
import { ToneBanner } from './ToneBanner';
import type { ResolveMasterSource } from './ResolveMasterBadge';
import { ResolveMasterBadge } from './ResolveMasterBadge';
import { CacheHitBadge, MissingMasterBadge } from '../../shared/StatusBadge';

const MASTER_SOURCES: ResolveMasterSource[] = ['mock', 'snapshot', 'server', 'fallback'];

export interface OrderConsoleProps {
  masterSource: ResolveMasterSource;
  missingMaster: boolean;
  cacheHit: boolean;
  missingMasterNote: string;
  runId: string;
  tone: BannerTone;
  toneMessage: string;
  patientId: string;
  receptionId: string;
  destination: string;
  nextAction: string;
  transitionDescription: string;
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
  tone,
  toneMessage,
  patientId,
  receptionId,
  destination,
  nextAction,
  transitionDescription,
  onMasterSourceChange,
  onToggleMissingMaster,
  onToggleCacheHit,
  onMissingMasterNoteChange,
}: OrderConsoleProps) {
  return (
    <section className="order-console" data-run-id={runId}>
      <div className="order-console__status-steps" aria-label="tone banner and master source badge">
        <div className="order-console__step">
          <span className="order-console__step-label">Step 1: Tone (tone=server chain)</span>
          <ToneBanner
            tone={tone}
            message={toneMessage}
            patientId={patientId}
            receptionId={receptionId}
            destination={destination}
            nextAction={nextAction}
            runId={runId}
          />
        </div>
        <div className="order-console__step">
          <span className="order-console__step-label">Step 2: resolveMasterSource</span>
          <ResolveMasterBadge
            masterSource={masterSource}
            transitionDescription={transitionDescription}
            runId={runId}
          />
        </div>
      </div>
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
            missingMaster コメント（監査に記録）
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
            role="alert"
            aria-live={missingMaster ? 'assertive' : 'polite'}
          >
            {missingMaster
              ? 'マスタ欠損: auditEvent にノートを残し tone=server の warning を維持'
              : 'マスタ取得済み: auditEvent を info として更新し cacheHit=true と同期'}
          </div>
        </div>
      </div>
    </section>
  );
}
