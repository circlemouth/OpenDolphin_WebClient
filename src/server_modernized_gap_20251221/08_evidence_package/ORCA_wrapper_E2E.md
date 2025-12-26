# ORCA Wrapper E2E 証跡パッケージ
- 期間: 2026-01-12 09:00 - 2026-01-14 09:00 / 優先度: medium / 緊急度: low
- RUN_ID: 20251226T061010Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/ORCA_wrapper_E2E.md`

## 目的
- ORCA certification 環境で ORCA Wrapper の POST API を最終段階で実測し、証跡を統合する。
- 外部依存（認証・接続先）と切替手順を明確化し、最終検証時に即時実行できる状態を作る。

## 対象 API（ORCA Wrapper POST）
- `/orca/chart/subjectives`（subjectives）
- `/orca/medical/records`（medical records）
- `/orca/medical-sets`
- `/orca/tensu/sync`
- `/orca/birth-delivery`
- `/orca/disease`
- `/orca/patient/mutation`

## 実測ステータス
- **実測完了（Stub/Local 混在）**
  - subjectives / medical-sets / tensu / birth-delivery は Trial 未開放のため stub 応答 (`Api_Result=79`)。
  - medical records / disease / patient mutation は local DB を使用し `Api_Result=00`。

## 外部依存の証跡
- 参照元: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`
  - 接続先 URL / Basic 認証 / 運用ルールを同ファイルに集約。
  - 認証値は `<MASKED>` で記録する。

## 実施手順（E2E 実測）
1. 起動準備: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（起動済みのため再起動なし）
2. ORCA Wrapper を local 実装で呼び出し、各 POST API を実行。
3. 監査ログを DB（`opendolphin.d_audit_event`）から抽出。

## Evidence 記録（実測結果）
- 実施日時: 2025-12-26 15:28 JST
- 実施者: worker-orca-master
- RUN_ID: 20251226T061010Z
- 接続先: `<MASKED_ORCA_CERT_URL>`
- 認証: `<MASKED_BASIC>`

### Request/Response（HTTP ステータス / Api_Result）
- `/orca/chart/subjectives`: 200 / `Api_Result=79` (stub)
- `/orca/medical/records`: 200 / `Api_Result=00`
- `/orca/medical-sets`: 200 / `Api_Result=79` (stub)
- `/orca/tensu/sync`: 200 / `Api_Result=79` (stub)
- `/orca/birth-delivery`: 200 / `Api_Result=79` (stub)
- `/orca/disease`: 200 / `Api_Result=00`
- `/orca/patient/mutation`: 200 / `Api_Result=00`

### 監査ログ（マスク済み）
- `artifacts/orca-connectivity/20251226T061010Z/audit_orca_wrapper_db.txt`
- 必須キー: `runId`, `facilityId`, `requestId`, `patientId`, `operation` など

### 取得物
- Request/Response:
  - `artifacts/orca-connectivity/20251226T061010Z/wrapper/*.request.json`
  - `artifacts/orca-connectivity/20251226T061010Z/wrapper/*.json`
  - `artifacts/orca-connectivity/20251226T061010Z/wrapper/*.status`

## 次アクション
1. ORCA certification 環境で real 実測が可能になった時点で stub を real に切替し、再計測する。
2. 取得済みの監査ログと API ステータスを `ORCA_API_STATUS_更新.md` に反映する。
