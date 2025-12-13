# 13 データ取得レイヤの統一（fetchWithResolver）

- RUN_ID: `20251213T133932Z`
- 期間: 2025-12-26 09:00 〜 2025-12-29 09:00 (JST) / 優先度: high / 緊急度: medium / エージェント: codex
- YAML ID: `src/charts_production_outpatient/foundation/13_データ取得レイヤの統一_fetchWithResolver.md`
- 参照: `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`、`src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`、`src/charts_production_outpatient/foundation/11_監査ログauditEvent統一.md`、`src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251213T133932Z-charts-fetch-with-resolver.md`

---

## 0. 結論（今回の統一内容）
- 外来 API 呼び出し（claim / appointment / medical）を新設の `fetchWithResolver` で一元化し、**runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/resolveMasterSource/fetchedAt/recordsReturned** を必ず返す。
- React Query のキャッシュ判定（servedFromCache）・retry 回数を meta に取り込み、UI Pill/Badge と `logUiState(action='outpatient_fetch')`／`telemetryClient.recordOutpatientFunnel(stage='charts_orchestration')` へ同期。
- DTO→ViewModel 変換（予約リスト整形・metadata 正規化）を `features/outpatient/transformers.ts` へ集約し、レイヤ間でコードを重複させない。

## 1. 実装サマリ
- `web-client/src/features/outpatient/fetchWithResolver.ts`
  - candidates（path+source）を `preferredSource` で並べ替え、リクエスト後にレスポンス/ヘッダー/ReactQuery meta から `OutpatientMeta` を構築。
  - `serveFromCache` ヒントと retry 回数を meta に入れ、失敗時も runId/dataSourceTransition を維持して Observability を更新。
- `web-client/src/features/outpatient/transformers.ts`
  - `normalizeBoolean`・`parseAppointmentEntries`・`mergeOutpatientMeta`・`attachAppointmentMeta` を追加し、DTO→ViewModel と meta 結合を一箇所に集約。
- `reception/api.ts` / `charts/api.ts`
  - fetch を `fetchWithResolver` 経由に置き換え。React Query meta から cacheHit/refetch 情報を注入し、`logUiState` + `recordOutpatientFunnel` に runId/transition/cacheHit/missingMaster/fallbackUsed を送出。
- `observability/types.ts` に `ResolveMasterSource` を追加し、`auditLogger` に `outpatient_fetch` アクションを追加。

## 2. UI/監査への反映ポイント
- `ChartsPage` / `ReceptionPage` の各 useQuery に meta（servedFromCache/retryCount）を設定し、Pill/Badge と audit/telemetry へ同値を露出。
- 取得結果が空でも `recordsReturned` と `dataSourceTransition` を埋め、トーンバナー・送信ガード・TelemetryFunnel の表示/判定がブレないようにした。

## 3. 未対応・今後のフォロー
- React Query の retry ルールと UI バナーの cooldown は 12 章の規約（cooldown=5s）へ追従が必要。今回は meta 収集のみ。
- `/api01rv2/patient/outpatient/*` 系は本タスク範囲外。患者取得/保存の統一は次ランナーで `fetchWithResolver` へ移行する。
- Stage/Preview 実 API 検証は未実施（MSW 依存）。`VITE_DISABLE_MSW=1` + dev proxy での再検証時に本 RUN_ID を流用する。

## 4. 差分確認パス
- `npm run lint -- web-client/src/features/reception/api.ts ...` はスクリプト未定義のため未実行。ローカル lint/test を追加する場合は package.json へのスクリプト追加が必要。
- UI 確認: Reception/Charts の Pill/Badge が cacheHit/missingMaster/transition を保持し続けること、TelemetryFunnel に fetch ステージが追記されることを目視予定。
