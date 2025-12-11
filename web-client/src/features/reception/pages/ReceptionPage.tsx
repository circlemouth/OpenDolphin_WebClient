import { Global } from '@emotion/react';
import { useMemo, useState } from 'react';

import { logUiState } from '../../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../../libs/observability/observability';
import type { DataSourceTransition } from '../../../libs/observability/types';
import type { BannerTone } from '../components/ToneBanner';
import type { ResolveMasterSource } from '../components/ResolveMasterBadge';
import { OrderConsole } from '../components/OrderConsole';
import { receptionStyles } from '../styles';

type ReceptionPageProps = {
  runId?: string;
  patientId?: string;
  receptionId?: string;
  destination?: string;
  title?: string;
  description?: string;
};

const RUN_ID = '20251205T062049Z';
const PATIENT_ID = 'PX-2025-2304-001';
const RECEPTION_ID = 'R-20251204-003';
const DESTINATION = 'ORCA queue';

export function ReceptionPage({
  runId = RUN_ID,
  patientId = PATIENT_ID,
  receptionId = RECEPTION_ID,
  destination = DESTINATION,
  title = 'Reception UX コンポーネント実装',
  description =
    '`tone=server` バナーと `resolveMasterSource` バッジを ReceptionPage 直下でステップ的に表示し、OrderConsole に `missingMaster` 入力とメモのみを保持することで `aria-live` 調整を単一箇所に集約した UX を実現します。',
}: ReceptionPageProps) {
  const [masterSource, setMasterSource] = useState<ResolveMasterSource>('mock');
  const [missingMaster, setMissingMaster] = useState(true);
  const [cacheHit, setCacheHit] = useState(false);
  const [missingMasterNote, setMissingMasterNote] = useState('');

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

  const emitAudit = (
    action: 'tone_change' | 'save' | 'config_delivery',
    controlId: string,
    nextState?: Partial<{ missingMaster: boolean; cacheHit: boolean; masterSource: ResolveMasterSource }>,
  ) => {
    const nextMissing = nextState?.missingMaster ?? missingMaster;
    const nextCache = nextState?.cacheHit ?? cacheHit;
    const nextSource = nextState?.masterSource ?? masterSource;
    updateObservabilityMeta({
      runId,
      missingMaster: nextMissing,
      cacheHit: nextCache,
      dataSourceTransition: nextSource as DataSourceTransition,
    });
    logUiState({
      action,
      screen: 'reception/order-console',
      controlId,
      runId,
      missingMaster: nextMissing,
      cacheHit: nextCache,
      dataSourceTransition: nextSource as DataSourceTransition,
    });
  };

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page">
        <section className="reception-page__header">
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
        <OrderConsole
          masterSource={masterSource}
          missingMaster={missingMaster}
          cacheHit={cacheHit}
          missingMasterNote={missingMasterNote}
          runId={runId}
          tone={tone}
          toneMessage={summaryMessage}
          patientId={patientId}
          receptionId={receptionId}
          destination={destination}
          nextAction={nextAction}
          transitionDescription={transitionDescription}
          onMasterSourceChange={(value) => {
            setMasterSource(value);
            emitAudit('config_delivery', 'master-source', { masterSource: value });
          }}
          onToggleMissingMaster={() => {
            setMissingMaster((prev) => {
              const next = !prev;
              emitAudit('tone_change', 'toggle-missing-master', { missingMaster: next });
              return next;
            });
          }}
          onToggleCacheHit={() => {
            setCacheHit((prev) => {
              const next = !prev;
              emitAudit('tone_change', 'toggle-cache-hit', { cacheHit: next });
              return next;
            });
          }}
          onMissingMasterNoteChange={(value) => {
            setMissingMasterNote(value);
            emitAudit('save', 'missing-master-note');
          }}
        />
        <section className="reception-page__meta" aria-live="polite">
          <h2>ARIA/Tone 周りの意図</h2>
          <ol>
            <li>
              `tone=server` は `aria-live` を assertive にして最新ステータスのみ announce
              し、`aria-atomic=false` で二重読み上げを抑えています。
            </li>
            <li>
            `missingMaster`/`cacheHit` の Update は Chart/Patients でも同じ
            `status-badge` を再利用し、`role=status` + `data-run-id` で画面横断の carry-over を
            確認可能にします。
          </li>
          <li>
            `resolveMasterSource` は `runId=20251205T062049Z` を含むバッジで
              `dataSourceTransition=server` を明示し、`missingMaster=false` の瞬間に tone/ARIA を
              `info` → `warning` に昇格させます。
          </li>
          </ol>
        </section>
      </main>
    </>
  );
}
