# Charts 外来 API 契約テーブル確定ログ（RUN_ID=20251212T143720Z）

## 1. 目的
- ガント「[webclient charts production outpatient plan] 03_モダナイズ外来API契約テーブル確定」の成果物として、Charts が利用する外来 API の契約（呼び出し条件・ヘッダー・監査・UI 反映・再試行/ガード）を単一ソースとして固定する。
- `dataSourceTransition/cacheHit/missingMaster/fallbackUsed/traceId` を UI と auditEvent に透過させるルールを明文化し、今後の Playwright フィクスチャの基準とする。

## 2. 生成物
- 契約テーブル: `src/charts_production_outpatient/03_モダナイズ外来API契約テーブル確定.md`

## 3. 更新したハブ/台帳（RUN_ID 同期）
- `docs/web-client/README.md`
- `docs/web-client/planning/phase2/DOC_STATUS.md`

## 4. 補足（制約順守）
- Legacy 資産（`client/`, `common/`, `ext_lib/`）および `server/` 配下は変更なし。
- ORCA 実接続や証明書操作は未実施（ドキュメント更新のみ）。

## 5. 実装・検証（2025-12-12 / RUN_ID=20251212T143720Z）
- Patients/Charts から `/api01rv2/patient/outpatient` を呼び出す取得ロジックを実装。`runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt/recordsReturned` を `observability`・`auditEvent.details`・UI バッジ・Telemetry (`recordOutpatientFunnel('patient_fetch')`)・`logUiState(action='patient_fetch', screen='patients')` へ透過。
- `missingMaster` または `fallbackUsed` が true の場合、PatientsTab/PatientsPage を readOnly 固定し、aria-live=assertive の案内バナーと保存ブロックを表示。5xx/timeout は再取得ボタンを提示。
- MSW fixture: `/api01rv2/patient/outpatient` 向けに normal / missingMaster / fallbackUsed / timeout(504) の 4 シナリオを追加し、レスポンスヘッダーと body meta（runId/transition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned/status）を一致させた。
- Playwright: `tests/e2e/outpatient-patient-fetch.msw.spec.ts` を追加し、上記 4 シナリオの UI 透過（バッジ、footnote meta、再取得導線、readOnly ブロック）を検証できるようにした（MSW プロファイル専用）。本コミット時点では実行未実施。
