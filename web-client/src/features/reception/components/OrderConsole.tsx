import { useMemo, useState } from 'react';

import type { BannerTone } from './ToneBanner';
import { ToneBanner } from './ToneBanner';
import { ResolveMasterBadge, type ResolveMasterSource } from './ResolveMasterBadge';
import { CacheHitBadge, MissingMasterBadge } from '../../shared/StatusBadge';
import { handleOutpatientFlags } from '../../charts/orchestration';
import {
  recordOutpatientFunnel,
  type OutpatientFlagAttributes,
} from '../../../libs/telemetry/telemetryClient';

const MASTER_SOURCES: ResolveMasterSource[] = ['mock', 'snapshot', 'server', 'fallback'];

export function OrderConsole() {
  const [masterSource, setMasterSource] = useState<ResolveMasterSource>('mock');
  const [missingMaster, setMissingMaster] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  const [missingMasterNote, setMissingMasterNote] = useState('');
  const runId = '20251212T090000Z';
  const patientId = 'PX-2024-001';
  const receptionId = 'R-20251212-007';

  const tone: BannerTone = useMemo(() => {
    if (masterSource === 'fallback' || missingMaster) {
      return 'error';
    }
    if (masterSource === 'server') {
      return 'warning';
    }
    if (cacheHit) {
      return 'info';
    }
    return 'warning';
  }, [masterSource, missingMaster, cacheHit]);

  const summaryMessage = useMemo(() => {
    if (masterSource === 'server') {
      return missingMaster
        ? 'server へ遷移済だが missingMaster=true を監視中。再取得が必要です。'
        : 'server ソースで tone=server を保持し、ORCA 送信を再試行できます。';
    }
    if (masterSource === 'fallback') {
      return 'server から fallback へ降格。監査 metadata を再確認してください。';
    }
    return 'mock/snapshot ソース。データ更新は cacheHit で判断。';
  }, [masterSource, missingMaster]);

  const nextAction = missingMaster ? 'マスタ再取得' : 'ORCA 再送';
  const transitionDescription =
    masterSource === 'server'
      ? 'snapshot → server （tone=server）'
      : masterSource === 'fallback'
        ? 'server → fallback'
        : masterSource === 'snapshot'
          ? 'mock → snapshot'
          : 'mock fixtures';

  const emitTelemetryFlags = (nextCacheHit: boolean, nextMissingMaster: boolean) => {
    const flags: OutpatientFlagAttributes = {
      runId,
      cacheHit: nextCacheHit,
      missingMaster: nextMissingMaster,
    };
    recordOutpatientFunnel('resolve_master', {
      ...flags,
      dataSourceTransition: 'server',
    });
    handleOutpatientFlags(flags);
  };

  return (
    <section className="order-console">
      <ToneBanner
        tone={tone}
        message={summaryMessage}
        patientId={patientId}
        receptionId={receptionId}
        destination="ORCA queue"
        nextAction={nextAction}
        runId={runId}
      />
      <ResolveMasterBadge
        masterSource={masterSource}
        transitionDescription={transitionDescription}
        runId={runId}
      />
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
              onChange={(event) => setMasterSource(event.target.value as ResolveMasterSource)}
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
              onClick={() => {
                const nextMissingMaster = !missingMaster;
                setMissingMaster(nextMissingMaster);
                emitTelemetryFlags(cacheHit, nextMissingMaster);
              }}
            >
              missingMaster を {missingMaster ? 'false に' : 'true に'}
            </button>
            <button
              type="button"
              className="order-console__action"
              onClick={() => {
                const nextCacheHit = !cacheHit;
                setCacheHit(nextCacheHit);
                emitTelemetryFlags(nextCacheHit, missingMaster);
              }}
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
            onChange={(event) => setMissingMasterNote(event.target.value)}
            placeholder="クロスチェックや再送結果を記録" 
            aria-describedby="missing-master-note-description"
          />
          <div
            id="missing-master-note-description"
            className="order-console__note"
            role="status"
            aria-live="polite"
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
