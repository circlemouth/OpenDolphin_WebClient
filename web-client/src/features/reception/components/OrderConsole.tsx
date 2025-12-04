import { useEffect, useMemo, useState } from 'react';

import type { BannerTone } from './ToneBanner';
import { ToneBanner } from './ToneBanner';
import { ResolveMasterBadge, type ResolveMasterSource } from './ResolveMasterBadge';
import { CacheHitBadge, MissingMasterBadge } from '../../shared/StatusBadge';
import { useAuthService, type DataSourceTransition } from '../../charts/authService';
import { computeChartTone } from '../../../ux/charts/tones';

const MASTER_SOURCES: ResolveMasterSource[] = ['mock', 'snapshot', 'server', 'fallback'];
const SOURCE_TO_TRANSITION: Record<ResolveMasterSource, DataSourceTransition> = {
  mock: 'mock',
  snapshot: 'snapshot',
  server: 'server',
  fallback: 'fallback',
};

export function OrderConsole() {
  const [masterSource, setMasterSource] = useState<ResolveMasterSource>('mock');
  const [missingMasterNote, setMissingMasterNote] = useState('');
  const { flags, setMissingMaster, setCacheHit, setDataSourceTransition } = useAuthService();
  const runId = flags.runId;
  const patientId = 'PX-2024-001';
  const receptionId = 'R-20251212-007';

  useEffect(() => {
    setDataSourceTransition(SOURCE_TO_TRANSITION[masterSource]);
  }, [masterSource, setDataSourceTransition]);

  const tone: BannerTone = computeChartTone({
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  });

  const summaryMessage = useMemo(() => {
    if (flags.missingMaster) {
      return 'missingMaster=true を検知。再取得完了まで tone=server を維持します。';
    }
    if (flags.cacheHit) {
      return 'cacheHit=true：キャッシュ命中で ORCA 再送へすぐ移行できます。';
    }
    if (masterSource === 'server') {
      return 'server ソースで tone=server を保持し、ORCA 送信を再試行できます。';
    }
    if (masterSource === 'fallback') {
      return 'server から fallback へ降格。監査 metadata を再確認してください。';
    }
    return 'mock/snapshot ソース。データ更新は cacheHit で判断。';
  }, [flags.cacheHit, flags.missingMaster, masterSource]);

  const nextAction = flags.missingMaster ? 'マスタ再取得' : 'ORCA 再送';
  const transitionDescription =
    masterSource === 'server'
      ? 'snapshot → server （tone=server）'
      : masterSource === 'fallback'
        ? 'server → fallback'
        : masterSource === 'snapshot'
          ? 'mock → snapshot'
          : 'mock fixtures';

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
          <CacheHitBadge cacheHit={flags.cacheHit} runId={runId} />
          <MissingMasterBadge missingMaster={flags.missingMaster} runId={runId} />
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
<<<<<<< HEAD
              onClick={() => {
                const nextMissingMaster = !missingMaster;
                setMissingMaster(nextMissingMaster);
                emitTelemetryFlags(cacheHit, nextMissingMaster);
              }}
=======
              onClick={() => setMissingMaster(!flags.missingMaster)}
>>>>>>> task/task-1764881936124-139342
            >
              missingMaster を {flags.missingMaster ? 'false に' : 'true に'}
            </button>
            <button
              type="button"
              className="order-console__action"
<<<<<<< HEAD
              onClick={() => {
                const nextCacheHit = !cacheHit;
                setCacheHit(nextCacheHit);
                emitTelemetryFlags(nextCacheHit, missingMaster);
              }}
=======
              onClick={() => setCacheHit(!flags.cacheHit)}
>>>>>>> task/task-1764881936124-139342
            >
              cacheHit を {flags.cacheHit ? 'false に' : 'true に'}
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
            {flags.missingMaster
              ? 'マスタ欠損: ORCA 送信をブロックし tone=server の warning を維持'
              : 'マスタ取得済み: ORCA 送信の再開と cacheHit true の組み合わせを sustain'}
          </div>
        </div>
      </div>
    </section>
  );
}
