# 41 `/orca/appointments/list/*` 統合（予約/来院）（webclient charts production outpatient plan）

- RUN_ID: `20251217T234312Z`
- 期間: 2026-01-10 09:00 〜 2026-01-13 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: claude code
- YAML ID: `src/charts_production_outpatient/integration/41_appointment_outpatient統合.md`
- 参照: `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`、`docs/web-client/architecture/web-client-api-mapping.md`、`web-client/src/features/reception/api.ts`
- 証跡ログ: `src/charts_production_outpatient/integration/logs/20251217T234312Z-appointment-outpatient-integration.md`

---

## 目的
Charts が利用する「予約一覧 / 患者別予約 / 来院中リスト」（`/orca/appointments/list/*`）を **単一の正規化モデル**に統合し、以下を満たす。

1. `受付ID`（来院/受付に紐づくID）を UI 表示と監査メタの突合に使える形で保持する
2. 予約変更・キャンセルなど頻発操作は Charts から **導線（リンク/遷移）**として整備する
3. 予約データの未取得/不整合時の表示を `tone=info/warning` に統一する

---

## 結論（実装方針）
### A. 正規化（レスポンス → ReceptionEntry[]）
- `slots[]` / `reservations[]` / `visits[]` を同じ `ReceptionEntry` へ正規化する。
- `visits[]` の `voucherNumber` を `receptionId` として保持する（= 受付ID）。
- 同一患者/同一受付/同一予約が重複して返るケースを想定し、**優先順位（visits > slots > reservations）**で重複排除する。

### B. Charts からの導線
- Charts の患者詳細（PatientsTab）から Reception へ遷移し、検索キーワード（`kw`）を自動セットする。
- `intent=appointment_change|appointment_cancel` を URL に付与し、Reception 側でバナー表示して「何をしに来たか」を明示する。

### C. 未取得/不整合の表示統一
- Charts の複数ビュー（DocumentTimeline / PatientsTab）で同一ロジックのバナーを表示する。
- `loading && entries.length===0` → `info`
- `error` → `warning`
- `entries.length===0`（取得成功だが0件）→ `info`
- `patientId/appointmentId/receptionId` 欠損 → `warning`

---

## 実装メモ（ファイル単位）
- `web-client/src/features/outpatient/types.ts`
  - `ReceptionEntry.receptionId?: string` を追加。
- `web-client/src/features/outpatient/transformers.ts`
  - `slots/reservations/visits` のパースで `receptionId` を抽出し、重複排除（visits 優先）を追加。
  - `receptionId` 抽出は `voucherNumber` に加え `acceptanceId` の揺れも吸収する。
  - 重複排除のマージは `undefined` での上書きを避け、情報落ちを防止する（定義済みフィールド優先）。
  - ランダムID生成（Math.random）を廃止し、入力に基づく安定IDへ。
- `web-client/src/features/reception/api.ts`
  - 空データ時の **サンプル注入を撤廃**（MSW fixture のみがサンプル提供）。
- `web-client/src/features/outpatient/appointmentDataBanner.ts`
  - 予約/来院データの未取得/不整合を `tone=info/warning` で統一する共通ロジックを追加。
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - 予約/来院のバナーを生成し、DocumentTimeline / PatientsTab へ伝播。
- `web-client/src/features/charts/DocumentTimeline.tsx`
  - 受付ID（`receptionId`）の表示を追加。
  - 予約/来院のバナー表示を追加。
- `web-client/src/features/charts/PatientsTab.tsx`
  - 受付ID表示を追加。
  - 予約変更/キャンセルの導線（Reception への遷移）を追加。
- `web-client/src/features/reception/pages/ReceptionPage.tsx`
  - `intent` パラメータを保持し、Charts から来たことをバナーで表示。
  - Reception 一覧でも `受付ID` を表示し、受付側での突合が Charts 依存にならないようにする。

---

## 受け入れ条件（DoD）
- Charts で `/orca/appointments/list/*` 由来のデータが 0 件 / 取得失敗 / 欠損ありの場合に、`tone=info/warning` のバナーが表示される。
- `visits[]` に `voucherNumber` がある場合、Charts 側で「受付ID」として表示される。
- Charts → Reception の遷移で `kw` と `intent` が設定され、Reception 側で意図バナーが表示される。
