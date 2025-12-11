import { Global } from '@emotion/react';
import { useMemo, useState } from 'react';

import type { BannerTone } from '../components/ToneBanner';
import type { ResolveMasterSource } from '../components/ResolveMasterBadge';
import { OrderConsole } from '../components/OrderConsole';
import { receptionStyles } from '../styles';
import type { AuthServiceFlags, DataSourceTransition } from '../../charts/authService';

type ReceptionPageProps = {
  runId?: string;
  patientId?: string;
  receptionId?: string;
  destination?: string;
  title?: string;
  description?: string;
  flags?: AuthServiceFlags;
  onToggleMissingMaster?: () => void;
  onToggleCacheHit?: () => void;
  onMasterSourceChange?: (next: DataSourceTransition) => void;
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
  flags,
  onToggleCacheHit,
  onToggleMissingMaster,
  onMasterSourceChange,
}: ReceptionPageProps) {
  const [missingMasterNote, setMissingMasterNote] = useState('');
  const masterSource = flags?.dataSourceTransition ?? 'snapshot';
  const missingMaster = flags?.missingMaster ?? true;
  const cacheHit = flags?.cacheHit ?? false;
  const effectiveRunId = flags?.runId ?? runId;
  const [localMasterSource, setLocalMasterSource] = useState<ResolveMasterSource>(masterSource);
  const currentMasterSource = onMasterSourceChange ? masterSource : localMasterSource;

  const tone: BannerTone = useMemo(() => {
    if (currentMasterSource === 'fallback' || missingMaster) {
      return 'error';
    }
    if (currentMasterSource === 'server') {
      return 'warning';
    }
    if (cacheHit) {
      return 'info';
    }
    return 'warning';
  }, [currentMasterSource, missingMaster, cacheHit]);

  const summaryMessage = useMemo(() => {
    if (currentMasterSource === 'server') {
      return missingMaster
        ? 'server へ遷移済だが missingMaster=true を監視中。再取得が必要です。'
        : 'server ソースで tone=server を保持し、ORCA 送信を再試行できます。';
    }
    if (currentMasterSource === 'fallback') {
      return 'server から fallback へ降格。監査 metadata を再確認してください。';
    }
    return 'mock/snapshot ソース。データ更新は cacheHit で判断。';
  }, [currentMasterSource, missingMaster, cacheHit]);

  const nextAction = missingMaster ? 'マスタ再取得' : 'ORCA 再送';
  const transitionDescription =
    currentMasterSource === 'server'
      ? 'snapshot → server （tone=server）'
      : currentMasterSource === 'fallback'
        ? 'server → fallback'
      : currentMasterSource === 'snapshot'
          ? 'mock → snapshot'
          : 'mock fixtures';

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page">
        <section className="reception-page__header">
          <h1>{title}</h1>
          <p>{description}</p>
        </section>
        <OrderConsole
          masterSource={currentMasterSource}
          missingMaster={missingMaster}
          cacheHit={cacheHit}
          missingMasterNote={missingMasterNote}
          runId={effectiveRunId}
          tone={tone}
          toneMessage={summaryMessage}
          patientId={patientId}
          receptionId={receptionId}
          destination={destination}
          nextAction={nextAction}
          transitionDescription={transitionDescription}
          onMasterSourceChange={(next) => {
            onMasterSourceChange?.(next as DataSourceTransition);
            if (!onMasterSourceChange) {
              setLocalMasterSource(next as ResolveMasterSource);
            }
          }}
          onToggleMissingMaster={() => {
            onToggleMissingMaster?.();
          }}
          onToggleCacheHit={() => {
            onToggleCacheHit?.();
          }}
          onMissingMasterNoteChange={setMissingMasterNote}
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
