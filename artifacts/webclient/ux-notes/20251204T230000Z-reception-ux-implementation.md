# RUN_ID=20251204T230000Z Reception UX コンポーネント実装メモ

- 目的: ReceptionPage/OrderConsole の tone/missingMaster/resolveMasterSource 周りをコードと CSS で整理し、UX policy どおりのバナー → バッジ → 入力フローを実装する証跡とする。

## 1. Props・フラグの整理
1. `ReceptionPage`
   - 管理対象: `masterSource`/`missingMaster`/`cacheHit`/`missingMasterNote` の state。`ToneBanner` には `tone`/`summaryMessage`/`nextAction`/`runId` を渡し、`ResolveMasterBadge` には `masterSource` + `transitionDescription`/`runId` を渡す。
   - `tone` は `fallback` または `missingMaster` で error、`server` で warning、`cacheHit` で info、その他は warning（元実装と同じ）で、`summaryMessage` は server/fallback/その他で文言を切替える。
   - `TransitionDescription` は `mock → snapshot` → `snapshot → server（tone=server）` → `server → fallback` の文字列を準備し、バッジの `role=note` エリアに表示。
2. `OrderConsole`
   - 受け渡し: `masterSource`/`missingMaster`/`cacheHit`/`missingMasterNote` に加えて `runId`、`onMasterSourceChange`/`onToggleMissingMaster`/`onToggleCacheHit`/`onMissingMasterNoteChange` を props で受け取る。
   - UI: `ToneBanner`/`ResolveMasterBadge` を持たず、`CacheHitBadge`・`MissingMasterBadge`（`runId` 付き）とコントロールパネル＋ `missingMaster` メモだけ。`missingMaster` ノートは `aria-live={missingMaster ? 'assertive' : 'polite'}` にして warning のみ通知する。
   - `MASTER_SOURCES` セレクトから `masterSource` を更新し、ボタンで `missingMaster`/`cacheHit` フラグを立て外すことで `ToneBanner` に連動する `resolveMasterSource` の変化を再現。

## 2. スタイルと共有
- `web-client/src/features/reception/styles.ts` に `tone-banner`/`resolve-master`/`order-console`/`status-badge` 系のセレクタを移し、ReceptionPage で `Global` を使って注入。Charts/Patients でも同じ CSS を使えるようになるため、`missingMaster`/`cacheHit` 表示のトーンが Reception 版と揃う。
- `Global` スタイルは `ReceptionPage` の先頭で `receptionStyles` を挿入し、`order-console__action` のメディアクエリも受け継いでいる。

## 3. 次アクション・証跡
- `docs/web-client/ux/reception-schedule-ui-policy.md` §10 に最新実装メモとスクリーンショット候補（`artifacts/webclient/ux-notes/20251204T230000Z-reception-ux-implementation.png`）を追記。
- `docs/server-modernization/phase2/operations/logs/20251204T230000Z-reception-ux.md` で API 依存（`web-client/src/libs/http/httpClient.ts` の `OUTPATIENT_API_ENDPOINTS`/`header-flags` を通じた `missingMaster` フラグ）と DOC_STATUS 更新を記録。
