import { Global } from '@emotion/react';

import { AuthServiceControls } from '../AuthServiceControls';
import { AuthServiceProvider, useAuthService } from '../authService';
import { DocumentTimeline } from '../DocumentTimeline';
import { OrcaSummary } from '../OrcaSummary';
import { PatientsTab } from '../PatientsTab';
import { chartsStyles } from '../styles';
import { receptionStyles } from '../../reception/styles';

const DEFAULT_RUN_ID = '20251205T150000Z';

type ChartsPageProps = {
  runId?: string;
};

export function ChartsPage({ runId }: ChartsPageProps) {
  const resolvedRunId = runId ?? DEFAULT_RUN_ID;

  return (
    <AuthServiceProvider initialFlags={{ runId: resolvedRunId }}>
      <Global styles={[receptionStyles, chartsStyles]} />
      <ChartsContent />
    </AuthServiceProvider>
  );
}

function ChartsContent() {
  const { flags } = useAuthService();

  return (
    <main className="charts-page" data-run-id={flags.runId}>
      <section className="charts-page__header">
        <h1>Charts / ORCA トーン連携デモ</h1>
        <p>
          Reception での `missingMaster` / `cacheHit` / `dataSourceTransition` を Charts 側へキャリーし、DocumentTimeline・
          OrcaSummary・Patients の各カードで同じ RUN_ID を基点にトーンをそろえます。Auth-service からのフラグを右上の
          コントロールで切り替え、監査メタの carry over を確認できます。
        </p>
        <div className="charts-page__meta" aria-live="polite">
          <span className="charts-page__pill">RUN_ID: {flags.runId}</span>
          <span className="charts-page__pill">dataSourceTransition: {flags.dataSourceTransition}</span>
          <span className="charts-page__pill">missingMaster: {String(flags.missingMaster)}</span>
          <span className="charts-page__pill">cacheHit: {String(flags.cacheHit)}</span>
        </div>
      </section>

      <section className="charts-page__grid">
        <div className="charts-card">
          <AuthServiceControls />
        </div>
        <div className="charts-card">
          <DocumentTimeline />
        </div>
        <div className="charts-card">
          <OrcaSummary />
        </div>
        <div className="charts-card">
          <PatientsTab />
        </div>
      </section>
    </main>
  );
}
