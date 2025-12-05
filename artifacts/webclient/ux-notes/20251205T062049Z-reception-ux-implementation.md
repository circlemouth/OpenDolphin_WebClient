# 20251205T062049Z Reception UX 実装整理

## ReceptionPage に渡っているフラグ／派生値
- `masterSource` (mock/snapshot/server/fallback) は `ResolveMasterSource` 型で、`ToneBanner` と `ResolveMasterBadge` の両方に渡す。`transitionDescription` は `server`/`fallback`/`snapshot` それぞれの遷移文言を返しており、`ResolveMasterBadge` の補助説明になる。
- `missingMaster` は `tone` の最優先トリガで、`true` なら `tone` が error になり warning/info を上書きする。`OrderConsole` へもそのまま渡し、バッジ・トグル・メモ欄・ARIA の状態を切り替える。
- `cacheHit` は `tone` の `info` 条件と `カルテ/Patients` の `cacheHit` 表示に供され、`OrderConsole` の `CacheHitBadge` へ渡して色分けと `aria-live="polite"` を担保。
- `missingMasterNote` は `OrderConsole` 内の `textarea` と `role="status"` で紹介され、`aria-live` は `missingMaster` に応じて `assertive`/`polite` を切り替えている。
- `tone` は `useMemo` で `masterSource === 'fallback' || missingMaster` → `error`、`masterSource === 'server'` → `warning`、`cacheHit` → `info`、それ以外で `warning` を返す。`missingMaster` を中央に据えた tone ルール。
- `summaryMessage` も `masterSource` と `missingMaster` で分岐し、`ToneBanner` の文言が `server`→`missingMaster` 監視／取得済みの説明を切り替え。
- `nextAction` は `missingMaster` に応じて「マスタ再取得／ORCA 再送」を表し、`ToneBanner` に渡される `nextAction` を通じて `aria-live` で announce される流れになっている。

## OrderConsole の責務と props
- `CacheHitBadge`/`MissingMasterBadge`（`StatusBadge` をラップ）は `web-client/src/features/reception/styles.ts` の `.status-badge` 系スタイルを前提とし、`tone`/`description`/`aria-live` を `missingMaster`／`cacheHit` で切り替える。
- `resolveMasterSource` を選ぶ select で `onMasterSourceChange` を呼び、警告トーンの変化や `transitionDescription` をトリガする（`masterSource` の変更→`tone`/`summary` の再計算）。
- `missingMaster`/`cacheHit` トグルボタンはメインの flag 制御で、`aria-live` 付きメモ（`role="status"`）の説明文を state 依存で `missingMaster` 警告／取得済みの２種に切り替える。
- `missingMasterNote` の textarea は `OrderConsole` に集中し、`aria-describedby` 付きの status note へ内容を注入することで `aria-live` の調整対象を OrderConsole に限定している。
- `data-run-id` を `order-console__grid` と badge に埋めており、Reception/Charts 間で監査 carry-over を可能にするメタデータを保持している。

## 共有スタイル周り
- `StatusBadge` 系の `.status-badge`/`.status-badge--warning` などは `web-client/src/features/reception/styles.ts` に定義されている。Charts/Patients でも同じコンポーネントを使うため、このファイルが共通スタイルの源泉になっている。
- `tone-banner`/`resolve-master`/`order-console` まわりのレイアウトもこのスタイルに集約されており、`ReceptionPage` で `<Global styles={receptionStyles} />` を inject して全体を包む構成になっている。

## 次の調整に向けた観察
1. `ToneBanner`（tone=server）と `ResolveMasterBadge` を段階的に（1→2）表示する UI に整え、`missingMaster` の note は OrderConsole に集約して `aria-live` の制御を単一箇所で行えるようにしたい。
2. Chart/Patients の `missingMaster`/`cacheHit` 表示も `status-badge` 系スタイルを再利用する前提なので、必要な class セレクタが `styles.ts` にあることを再確認し、他所で重複定義があればそちらを削除する。
3. `RUN_ID=20251204T230000Z` の定数を今回の `RUN_ID=20251205T062049Z` に合わせること、docs/log/artifact の RUN_ID を同期すること。
