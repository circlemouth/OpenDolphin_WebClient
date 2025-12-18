# 42 `/orca21/medicalmodv2/outpatient` 表示セクション分割（医療記録）

- RUN_ID: `20251218T105723Z`
- 期間: 2026-01-14 09:00 〜 2026-01-19 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: cursor cli
- YAML ID: `src/charts_production_outpatient/integration/42_medicalmodv2_outpatient表示セクション分割.md`
- 参照: `docs/web-client/architecture/web-client-api-mapping.md`、`src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`（1.3）、`docs/web-client/ux/charts-claim-ui-policy.md`
- 証跡ログ: `src/charts_production_outpatient/integration/logs/20251218T105723Z-medicalmodv2-outpatient-sections.md`

---

## 0. 目的
外来医療記録（`/orca21/medicalmodv2/outpatient`）を “市販カルテ相当” の読みやすさで閲覧できるよう、以下を満たす UI を追加する。

1) 診断/処方/検査/処置/メモの **セクション分割表示**  
2) セクションごとに **未取得/欠落/エラー** を部分表示し、全体停止（画面全体が壊れる）を避ける  
3) `recordsReturned/outcome` を UI 表示と監査ログ（`logAuditEvent`/`logUiState`）に反映し、監査で追える形にする

---

## 1. UI 仕様（最低ライン）

### 1.1 パネル配置
- Charts のカード群に **「医療記録」パネル**を追加する（OrcaSummary の直下）。
- 表示対象の患者は `ChartsEncounterContext.patientId` を優先し、未指定時は先頭レコードを表示する。

### 1.2 セクション構成
- 診断 / 処方 / 検査 / 処置 / メモ の 5 セクション（`<details>` による折りたたみ）
- 既定の挙動:
  - `MISSING`: 折りたたみ（閉）をデフォルト
  - `SUCCESS/PARTIAL/ERROR`: 展開（開）をデフォルト

### 1.3 セクション outcome の表示
- 各セクションに対して `outcome` を解釈し、以下の文言で表示する。
  - `SUCCESS`: 取得済み
  - `MISSING`: 未取得
  - `PARTIAL`: 一部欠落
  - `ERROR`: エラー（message があれば併記）
- 全体 `outcome` は「セクション集計（ERROR/MISSING が混在したら PARTIAL）」で導出し、パネル上部の `StatusBadge` に表示する。

---

## 2. 監査ログ反映（recordsReturned/outcome）

### 2.1 UI state（`logUiState`）
- `action='outpatient_fetch'` の `details` に `recordsReturned/outcome` を格納する。
- `screen='charts'` を維持しつつ、医療記録側は `MedicalOutpatientRecordPanel` で outcome を明示する。

### 2.2 audit event（`logAuditEvent`）
`fetchOrcaOutpatientSummary` の完了時に `logAuditEvent` を 1 件追加する。

- `payload.action`: `ORCA_MEDICAL_OUTPATIENT_FETCH`
- `payload.details`:
  - `runId/traceId/requestId`
  - `dataSourceTransition/cacheHit/missingMaster/fallbackUsed`
  - `fetchedAt/recordsReturned/outcome`
  - `sectionOutcomes`（key/outcome/recordsReturned）
  - `sourcePath/httpStatus`（※失敗時の追跡）

---

## 3. 実装（主な変更点）

### 3.1 追加コンポーネント
- `web-client/src/features/charts/MedicalOutpatientRecordPanel.tsx`
  - Charts のカードとして医療記録セクションを表示。
  - `summary.outcome/httpStatus` を見て、取得失敗時は「再取得は OrcaSummary から」を案内。

### 3.2 パース/集計ロジック
- `web-client/src/features/charts/medicalOutpatient.ts`
  - `extractMedicalOutpatientRecord(payload, patientId)` で表示対象レコードを抽出。
  - セクション outcome の正規化と overall outcome の導出。

### 3.3 fetch と監査
- `web-client/src/features/charts/api.ts`
  - `fetchOrcaOutpatientSummary` の `summary.outcome` を補完し、`recordsReturned/outcome` を監査ログへ反映。

### 3.4 MSW fixture
- `web-client/src/mocks/fixtures/outpatient.ts`
  - `buildMedicalSummaryFixture` に `outcome/requestId/sections` を追加し、部分欠落/エラーの表示を検証可能化。

---

## 4. 検証観点（ローカル）
- `MedicalOutpatientRecordPanel` が Charts に表示されること（診断/処方/検査/処置/メモが出る）
- `fallbackUsed=true`（MSW scenario）で:
  - 処方: `MISSING`
  - 検査: `ERROR`（message 表示）
  - overall outcome が `PARTIAL` になる
- `logUiState` と `logAuditEvent` に `recordsReturned/outcome` が出力されること（コンソール/`window.__AUDIT_*__`）

---

## 5. 更新対象（DOC_STATUS/README）
- `docs/web-client/planning/phase2/DOC_STATUS.md`（RUN_ID/証跡パス追記）
- `docs/web-client/README.md`（最新更新サマリへ反映）

