# Charts UI Audit (RUN_ID=20251205T153000Z)

- **DocumentTimeline.tsx**
  - `useAuthService` から受け取った `flags`（`missingMaster`/`cacheHit`/`dataSourceTransition`/`runId`）を `getChartToneDetails` に与え、`ToneBanner` で `tone` と `missingMaster` 状態に応じたメッセージを aria-live 領域として提示。
  - `transitionMeta` は `getChartToneDetails` で共通化され、`dataSourceTransition=server` 時の `label`/`description` を右カラムに表示。missingMaster entry は `document-timeline__entry--highlight` で口頭強調し、全体に `data-run-id=flags.runId` を渡して carry over を保持。
  - `StatusBadge`（`missingMaster`/`cacheHit`）を並列に配置し、それぞれ `ariaLive` を `assertive`/`polite` で切り替えて `missingMaster`→`dataSourceTransition=server` の tone を可視化。

- **OrderConsole.tsx**
  - `ToneBanner` を OrderConsole 内部に追加し、`missingMaster`/`cacheHit` の combination から `getChartToneDetails` で tone/message を同一の定義に寄せる。バナーには `destination="ORCA queue"`・`nextAction` を設定し、`ariaLive` を `tone` に応じて `assertive`/`polite` で切り替え。
  - ステータス群では `CacheHitBadge` と `MissingMasterBadge`（`StatusBadge` を再利用）を `runId` を渡して再描画し、トグルボタン＋ `textarea` で flag 操作とコメントを収集。`missingMaster` true 時はノートを `aria-live=assertive` にしてバナーと同期。
  - `masterSource` セレクトで `dataSourceTransition` を変更し、`getChartToneDetails` の入力が変わると ToneBanner + badges が再描画される仕組み。

- **OrcaSummary.tsx**
  - `getChartToneDetails` から `tone`/`message`/`transitionMeta` を受け取り、`ToneBanner` には `ariaLive` を明示して warning/error を assertive で announce。`summaryMessage` は `missingMaster`/`cacheHit`/`transitionMeta` を使って `dataSourceTransition` が server に遷移したタイミングで copy が変わるよう `useMemo` を依存付きで再計算。
  - メタ領域（`orca-summary__meta`）で `transitionMeta.label` と `description` を出力し、`dataSourceTransition=server` に対応する文言を表示。
  - `StatusBadge` に `missingMaster`/`cacheHit` を並べ、`ariaLive` 付きで state の carry over を担保。

- **PatientsTab.tsx**
  - `getChartToneDetails` の `tone`/`message`/`transitionMeta` を使って `ToneBanner`（`aria-live` は tone 依存）を定義し、`dataSourceTransition=server` 時の explanation を共通 copy から取る。
  - `StatusBadge` で missingMaster/cacheHit を示し、トーンが `Warning`/`Info` で reception と一致するよう `tone` クラスを再利用。各 `patients-tab__row` は `data-run-id=flags.runId` を持ち、`missingMaster` 時はラベルを `missingMaster 警告` に切り替えて `dataSourceTransition` 変化を行レベルで通知。

- **共通依存**
  - `getChartToneDetails` が master flag → `tone`/`message`/`transitionMeta` を提供し、DocumentTimeline/OrcaSummary/PatientsTab/OrderConsole で `dataSourceTransition=server` copy を共有。`missingMaster`/`cacheHit` の状態はすべて `AuthService` 経由で受け取る `flags` で再描画され、`tone-banner` + `status-badge` セレクタを通じて Reception と同じトーン/ARIA を維持する。
