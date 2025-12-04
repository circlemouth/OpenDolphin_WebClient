# Charts UI Audit (RUN_ID=20251205T090000Z)

- **DocumentTimeline.tsx**
  - `AuthServiceProvider` へ登録した `missingMaster`/`cacheHit`/`dataSourceTransition` フラグを `useAuthService` で取得し、`ux/charts/tones.ts` による `computeChartTone` で tone を統一。ToneBanner（`role=alert`/`aria-live=assertive` for warning）で `nextAction` を `missingMaster` 状態に応じて切り替え。
  - タイムラインカード群（`document-timeline__entry`）は `data-run-id` を付与し `missingMaster` ルートでハイライト。`StatusBadge` を再利用して `missingMaster`/`cacheHit` を `aria-live` 付きで表示し、`getTransitionMeta` で `dataSourceTransition=server` を含むステータス表示を共通化。

- **OrderConsole.tsx**
  - `AuthServiceProvider` から `flags` を取り出し、`setMissingMaster`/`setCacheHit`/`setDataSourceTransition` で `auth-service` の状態を他コンポーネントへ伝播。`MasterSource` の変更で `dataSourceTransition` を更新し、`computeChartTone` で DocumentTimeline/Patients と同一ロジックによる tone を ToneBanner に反映。
  - `ResolveMasterBadge` で `transitionDescription`（mock→snapshot→server→fallback）を表示しつつ、`CacheHitBadge`/`MissingMasterBadge` に `data-run-id` と `aria-live` を付与。missingMaster toggle は `useAuthService` へ伝播させ、`data-run-id` Carry Over を保証。

- **OrcaSummary.tsx**
  - `ToneBanner` + `StatusBadge` で `missingMaster`/`cacheHit` 情報を再表示。`getTransitionMeta` の `dataSourceTransition=server` 表示領域を `aria-live=polite` `role=status` で配置し、`audit` 相当の meta message を段落で説明。
  - `tone` は `computeChartTone` で DocumentTimeline/OrderConsole と一致。`runId` は `auth-service` から取得し、`data-run-id` 属性で carry over 可能に。

- **PatientsTab.tsx**
  - ヘッダー部で `ToneBanner` + `StatusBadge` を並列表示し、`cacheHit=true`（Info/青）と `missingMaster=true`（Warning/琥珀）の tone を `aria-live` 付きで表現。`dataSourceTransition=server` 表示は `getTransitionMeta` で文字列と description を共通化。
  - 一覧各行は `patients-tab__row` で `data-run-id` を共有し、`missingMaster`/`cacheHit` の状態に応じて状態ラベル（`missingMaster 警告`／`cacheHit 命中`）を切り替え。`AuthService` のフラグ変更がリアルタイムに tone を変えることで reception との整合性を確保。

- **共通要素**
  - `ux/charts/tones.ts` では `missingMaster`/`cacheHit`/`dataSourceTransition` を受けて API と連動する tone（info/warning/error）と `dataSourceTransition` の文言・説明を提供し、DocumentTimeline/OrcaSummary/PatientsTab/OrderConsole で再利用。
  - `AuthServiceProvider` で flag を管理し、`AuthServiceControls` からトグル可能にすることで `dataSourceTransition=server` が実際に `tone=server` トーンへ変わる様子を確認できる。「missingMaster=true の warning → cacheHit=true の info」へ transitions が一貫していて reception の tone ルールと一致。
