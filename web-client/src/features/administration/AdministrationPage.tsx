type AdministrationPageProps = {
  runId: string;
};

export function AdministrationPage({ runId }: AdministrationPageProps) {
  return (
    <main className="placeholder-page" data-test-id="administration-page">
      <h1>Administration（設定配信）</h1>
      <p className="placeholder-page__lead" role="status" aria-live="assertive">
        この画面はシステム管理者のみアクセス可能です。RUN_ID: <strong>{runId}</strong>
      </p>
      <ul className="placeholder-page__list">
        <li>ORCA 接続設定・MSW/モック切替・配信キューのUIをここに集約します。</li>
        <li>保存操作は audit / telemetry に runId を付与し、Stage/Preview への配信は証跡必須です。</li>
        <li>現時点ではプレースホルダーとして権限制御の挙動を示します。</li>
      </ul>
    </main>
  );
}
