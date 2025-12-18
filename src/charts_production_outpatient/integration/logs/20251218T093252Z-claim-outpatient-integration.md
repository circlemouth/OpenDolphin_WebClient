# 証跡ログ: 40 `/api01rv2/claim/outpatient/*` 統合（請求バンドル）

- RUN_ID: `20251218T093252Z`
- 対象: `web-client`（Charts: OrcaSummary/DocumentTimeline の請求バンドル統合）
- 参照: `src/charts_production_outpatient/integration/40_claim_outpatient統合.md`

---

## 実施内容
1. 請求バンドルのレスポンス揺れ（`claimBundles` だけでなく `claim:bundle` / `claim:information`）をパースで吸収し、会計ステータス判定を安定化。
2. 取得失敗（HTTP 4xx/5xx / ネットワーク例外）を UI で検出できるよう、`fetchWithResolver` の例外時にも `httpStatus=0` と `sourcePath` を保持。
3. Charts 側で `httpStatus/apiResult` を基に `claimError` を合成し、DocumentTimeline に再取得ボタンを出す（失敗時の導線を確立）。
4. “請求再取得” 操作を `logUiState` と `logAuditEvent` に記録し、取得の success/error は `fetchClaimFlags` の `CLAIM_OUTPATIENT_FETCH` と突合できるようにした。

---

## 変更点（主要ファイル）
- `web-client/src/features/outpatient/transformers.ts`
- `web-client/src/features/outpatient/fetchWithResolver.ts`
- `web-client/src/features/reception/api.ts`
- `web-client/src/features/charts/pages/ChartsPage.tsx`
- `web-client/src/features/charts/DocumentTimeline.tsx`

---

## 検証
- `npm -C web-client run typecheck` → OK
- `npm -C web-client test` → OK

---

## 補足
- `npm -C web-client ci` はユーザホームの npm cache 権限で失敗したため、ローカル cache を使って `npm_config_cache=.npm-cache npm -C web-client ci` で依存導入後に検証した。

