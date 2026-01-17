# 40 `/orca/claim/outpatient/*` 統合（請求バンドル）（webclient charts production outpatient plan）

- RUN_ID: `20251218T093252Z`
- 期間: 2026-01-06 09:00 〜 2026-01-10 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: codex
- YAML ID: `src/charts_production_outpatient/integration/40_claim_outpatient統合.md`
- 参照:
  - `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `web-client/src/features/reception/api.ts`
  - `web-client/src/features/charts/pages/ChartsPage.tsx`
- 証跡ログ: `src/charts_production_outpatient/integration/logs/20251218T093252Z-claim-outpatient-integration.md`

---

## 目的
Charts の `OrcaSummary` / `DocumentTimeline` が参照する “請求バンドル” を `/orca/claim/outpatient/*` から取得し、以下を満たす。

1. `runId` などのメタ（`dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned`）が UI と監査ログで同期していること
2. “会計待ち/会計済み” の判定を claim:information / claim:bundle 由来の値で安定させること
3. 取得失敗時に **再試行導線**（UI）と **成功/失敗監査**（auditEvent/logUiState）が揃うこと

---

## 結論（実装方針）
### A. 請求バンドルのパース統合（ORCA 互換）
- サーバ実装/経路差分により、請求バンドルが `claimBundles` だけでなく `claim:bundle` / `claim:information` で返るケースを許容する。
- `claim:information.status`（または同等フィールド）を既定ステータスとして扱い、bundle ごとのステータス欠損を吸収する。

### B. 失敗を UI に出す（再取得導線）
- `fetchWithResolver` の例外時（ネットワーク失敗など）でも `httpStatus=0` と `sourcePath` を保持し、Charts 側でエラーとして扱えるようにする。
- Charts では `httpStatus` / `apiResult` を元に “請求バンドル取得失敗” を検出し、DocumentTimeline に再取得ボタンを表示する。

### C. 監査ログを揃える
- “再取得” 操作自体は `logUiState(screen='charts/document-timeline', controlId='retry-claim')` と `logAuditEvent(action='CLAIM_OUTPATIENT_RETRY')` に記録する。
- 取得の成功/失敗は `fetchClaimFlags()` の `CLAIM_OUTPATIENT_FETCH` イベントで記録する（再取得の結果も同じルートで残る）。

---

## 実装メモ（ファイル単位）
- `web-client/src/features/outpatient/transformers.ts`
  - `claim:bundle` / `claim:information` を含むレスポンス揺れを吸収して請求バンドルを抽出・正規化。
- `web-client/src/features/outpatient/fetchWithResolver.ts`
  - 例外時でも `sourcePath` と `httpStatus=0` を meta に保持し、UI と監査に残せるようにした。
- `web-client/src/features/reception/api.ts`
  - `claim:information.status` を優先して `claimStatusText` を決定し、会計ステータス表示の安定性を上げた。
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - `httpStatus/apiResult` を元に `claimError` を合成し、失敗時に DocumentTimeline の再取得導線が表示されるようにした。
  - “請求再取得” 操作を `logUiState` と `logAuditEvent` に記録するようにした。
- `web-client/src/features/charts/DocumentTimeline.tsx`
  - ChartsPage から渡される追加 props（ページング/追加取得状態）を受け取り、UI へ反映できるようにした。

---

## 受け入れ条件（DoD）
- claim/outpatient のレスポンスが `claimBundles` / `claim:bundle` のどちらでも、Charts の請求サマリ/タイムラインが壊れない。
- `fallbackUsed=true` のとき、OrcaSummary/DocumentTimeline で警告が表示される。
- ネットワーク失敗や HTTP 4xx/5xx で “請求バンドルの取得に失敗” が表示され、再取得ボタンが表示される。
- 再取得操作が `logUiState` と `logAuditEvent` に残り、取得結果は `CLAIM_OUTPATIENT_FETCH` の success/error で追跡できる。

