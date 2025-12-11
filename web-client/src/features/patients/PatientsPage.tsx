type PatientsPageProps = {
  runId: string;
};

export function PatientsPage({ runId }: PatientsPageProps) {
  return (
    <main className="placeholder-page" data-test-id="patients-page">
      <h1>Patients（患者管理）</h1>
      <p className="placeholder-page__lead" role="status" aria-live="polite">
        Phase2 で患者検索・編集を実装予定です。RUN_ID: <strong>{runId}</strong>
      </p>
      <ul className="placeholder-page__list">
        <li>受付で設定した missingMaster / cacheHit / dataSourceTransition を引き継ぎます。</li>
        <li>ORCA 患者 API `/orca12/patientmodv2/outpatient` への書き込みを準備中です。</li>
        <li>ナビゲーション権限制御を通過した場合のみ表示されます。</li>
      </ul>
    </main>
  );
}
