import { useMemo } from 'react';

import { useSession } from '../../AppRouter';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { resolveAriaLive } from '../../libs/observability/observability';

type DebugLink = {
  label: string;
  description: string;
  href: string;
};

export function DebugHubPage() {
  const session = useSession();
  const debugPagesEnabled = import.meta.env.VITE_ENABLE_DEBUG_PAGES === '1';
  const debugUiEnabled = import.meta.env.VITE_ENABLE_DEBUG_UI === '1';
  const mswDisabled = import.meta.env.VITE_DISABLE_MSW === '1';

  const links = useMemo<DebugLink[]>(
    () => [
      {
        label: 'Outpatient Mock',
        description: 'Reception → Charts のトーン/テレメトリ検証用。msw=1 が必要。本番不可。',
        href: buildFacilityPath(session.facilityId, '/debug/outpatient-mock'),
      },
      {
        label: 'Outpatient Mock (MSW=1)',
        description: '障害注入ヘッダーを許可する URL。QA/検証専用、本番不可。',
        href: `${buildFacilityPath(session.facilityId, '/debug/outpatient-mock')}?msw=1`,
      },
      {
        label: 'Charts',
        description: 'Auth-service flags / Telemetry panel は VITE_ENABLE_DEBUG_UI=1 かつ system_admin。QA/検証専用。',
        href: buildFacilityPath(session.facilityId, '/charts'),
      },
      {
        label: 'ORCA API Console',
        description: '追加APIを XML2 で直接送信する QA/検証用コンソール。',
        href: buildFacilityPath(session.facilityId, '/debug/orca-api'),
      },
    ],
    [session.facilityId],
  );

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="debug-hub-title">
        <header className="login-card__header">
          <h1 id="debug-hub-title">デバッグ導線（QA/検証専用）</h1>
          <p>本番導線は完全非表示。QA/検証専用の入口です。環境フラグが OFF の場合は表示されません。</p>
        </header>
        <section className="status-message" aria-live={resolveAriaLive('info')}>
          <h2>前提条件（ENV/role）</h2>
          <p>VITE_ENABLE_DEBUG_PAGES=1 かつ system_admin ロールのみアクセス可能です。</p>
          <p>Charts 内のデバッグ UI は VITE_ENABLE_DEBUG_UI=1 が必要です。</p>
        </section>
        <section className="status-message" aria-live={resolveAriaLive('info')}>
          <h2>利用手順</h2>
          <ol style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
            <li>環境フラグとロールを確認</li>
            <li>Outpatient Mock は `msw=1` 付き URL で開く</li>
            <li>本番環境では利用不可のため、検証環境のみで実施</li>
          </ol>
        </section>
        <div className="status-message" role="status" aria-live={resolveAriaLive('info')}>
          <p>施設ID: {session.facilityId}</p>
          <p>ユーザー: {session.userId} / role={session.role}</p>
          <p>ENV: VITE_ENABLE_DEBUG_PAGES={debugPagesEnabled ? '1' : '0'}</p>
          <p>ENV: VITE_ENABLE_DEBUG_UI={debugUiEnabled ? '1' : '0'}</p>
          <p>ENV: VITE_DISABLE_MSW={mswDisabled ? '1' : '0'}</p>
        </div>
        <div className="login-form__actions" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
          {links.map((link) => (
            <a key={link.href} href={link.href} className="facility-entry__secondary" style={{ textAlign: 'left' }}>
              <strong>{link.label}</strong>
              <span style={{ display: 'block', fontSize: '0.85rem', opacity: 0.8 }}>{link.description}</span>
              <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6 }}>{link.href}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
