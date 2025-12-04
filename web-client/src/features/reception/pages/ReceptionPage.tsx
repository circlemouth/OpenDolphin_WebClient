import { OrderConsole } from '../components/OrderConsole';

export function ReceptionPage() {
  return (
    <main className="reception-page">
      <section className="reception-page__header">
        <h1>Reception UX コンポーネント実装</h1>
        <p>
          `tone=server` バナー、`resolveMasterSource` バッジ、`missingMaster` 入力を OrderConsole と
          Reception 全体で統一し、Charts/Patients の `missingMaster`/`cacheHit` 表示と tone を揃えます。
        </p>
      </section>
      <OrderConsole />
      <section className="reception-page__meta" aria-live="polite">
        <h2>ARIA/Tone 周りの意図</h2>
        <ol>
          <li>
            `tone=server` は `aria-live` を assertive にして最新ステータスのみ announce し、
            `aria-atomic=false` で二重読み上げを抑えています。
          </li>
          <li>
            `missingMaster`/`cacheHit` の Update は Chart/Patients でも同じ `status-badge` を再利用し、
            `role=status` + `data-run-id` で画面を横断した carry-over を確認可能にします。
          </li>
          <li>
            `resolveMasterSource` は `runId=20251212T090000Z` を含むバッジで `dataSourceTransition=server` を
            明示し、`missingMaster=false` の瞬間に tone/ARIA を `info` → `warning` に昇格させます。
          </li>
        </ol>
      </section>
    </main>
  );
}
