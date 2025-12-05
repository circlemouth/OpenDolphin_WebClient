import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';

const TIMELINE_ENTRIES = [
  { time: '09:05', title: '受付 → Charts 移動', detail: '受付で選択した患者ID／保険モードを受け取り開始。' },
  { time: '09:06', title: '文書履歴取得', detail: 'DocumentTimeline が `medicalrecord` を再描画。' },
  { time: '09:07', title: 'ORCA Queue 追加', detail: '診療終了後、ORCA queue を生成して再送準備。' },
  { time: '09:08', title: 'missingMaster チェック', detail: 'missingMaster=true を検知し tone=server バナーを表示。' },
];

export function DocumentTimeline() {
  const { flags } = useAuthService();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };

  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const entryList = useMemo(
    () =>
      TIMELINE_ENTRIES.map((entry) => (
        <article
          key={entry.time}
          className={`document-timeline__entry${flags.missingMaster && entry.title.includes('missingMaster') ? ' document-timeline__entry--highlight' : ''}`}
          data-run-id={flags.runId}
        >
          <header>
            <span className="document-timeline__entry-time">{entry.time}</span>
            <strong>{entry.title}</strong>
          </header>
          <p>{entry.detail}</p>
        </article>
      )),
    [flags.missingMaster, flags.runId],
  );

  return (
    <section
      className="document-timeline"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      role="region"
      data-run-id={flags.runId}
    >
      <ToneBanner
        tone={tone}
        message={toneMessage}
        runId={flags.runId}
        destination="ORCA Queue"
        nextAction={flags.missingMaster ? 'マスタ再取得' : 'ORCA再送'}
      />
      <div className="document-timeline__content">
        <div className="document-timeline__list">{entryList}</div>
        <div className="document-timeline__insights">
          <StatusBadge
            label="missingMaster"
            value={flags.missingMaster ? 'true' : 'false'}
            tone={flags.missingMaster ? 'warning' : 'success'}
            description={flags.missingMaster ? 'マスタ欠損を検知・再取得を待機中' : 'マスタ取得済み・ORCA 再送フェーズ'}
            ariaLive={flags.missingMaster ? 'assertive' : 'polite'}
            runId={flags.runId}
          />
          <StatusBadge
            label="cacheHit"
            value={flags.cacheHit ? 'true' : 'false'}
            tone={flags.cacheHit ? 'success' : 'warning'}
            description={flags.cacheHit ? 'キャッシュ命中：再取得不要' : 'キャッシュ未命中：再取得または server route を模索'}
            runId={flags.runId}
          />
          <div
            className={`document-timeline__transition document-timeline__transition--${transitionMeta.tone}`}
            role="status"
            aria-live="polite"
          >
            <strong>{transitionMeta.label}</strong>
            <p>{transitionMeta.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
