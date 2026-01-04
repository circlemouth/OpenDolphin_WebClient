# readOnly 状態遷移確認

## 目的
sidePanelMeta の readOnly/missingMaster/fallback などの状態が UI と API で一致し、運用上の誤解がないことを確認する。

## 実行前提
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、ログイン情報は同スクリプトの記載に従う
- missingMaster/fallback/dataSourceTransition を再現できるデータ条件が用意されていること
- 監査イベントを確認できる状態（UI の監査表示/ログ保存先の準備）

## 手順
- Patients/Charts で readOnly になる条件（missingMaster/fallback/dataSourceTransition）を再現
- 画面表示と監査イベントの内容を突合
- 反映停止/反映可能のステータス表示が運用と一致するか確認

## 成果物
- 状態遷移の確認表
- 不整合の一覧

## 実行結果
- RUN_ID: 20260104T022833Z
- 実行日: 2026-01-04（UTC）
- 実行環境: `WEB_CLIENT_MODE=npm` / MSW 有効（VITE_DISABLE_MSW=0）
- 証跡: `artifacts/validation/readonly/logs/readonly_audit_20260104T022833Z.md`
- スクリーンショット: `artifacts/validation/readonly/screenshots/`

## 状態遷移の確認表
| シナリオ | missingMaster | fallbackUsed | dataSourceTransition | Patients 反映可否 | Charts readOnly/ガード表示 | 監査イベント（最新表示） |
| --- | --- | --- | --- | --- | --- | --- |
| patient-normal | false | false | server | 反映可能（server ルート） | 閲覧モード（権限条件のみ） | PATIENT_OUTPATIENT_FETCH（runId=20251212T143720Z） |
| patient-missing-master | true | false | server | 反映停止（missingMaster=true） | 編集不可（missingMaster=true） | PATIENT_OUTPATIENT_FETCH（runId=20251212T143720Z） |
| patient-fallback | true | true | fallback | 反映停止（missingMaster=true / fallbackUsed=true） | 編集不可（fallbackUsed=true） | PATIENT_OUTPATIENT_FETCH（runId=20251212T143720Z） |
| snapshot-missing-master | true | false | snapshot | 反映停止（missingMaster=true / transition=snapshot） | 編集不可（transition=snapshot） | PATIENT_OUTPATIENT_FETCH（runId=20251212T143720Z） |

## 監査イベントの確認メモ
- 共通: Patients/Charts ともに `auditEvent` に `runId=20251212T143720Z` が表示され、UI バッジの runId と一致。
- patient-normal: Patients/Charts で `PATIENT_OUTPATIENT_FETCH` を表示（missingMaster=false, fallbackUsed=false）。
- patient-missing-master: Patients/Charts で `PATIENT_OUTPATIENT_FETCH` を表示（missingMaster=true）。
- patient-fallback: Patients/Charts で `PATIENT_OUTPATIENT_FETCH` を表示（missingMaster=true / fallbackUsed=true）。
- snapshot-missing-master: Patients/Charts で `PATIENT_OUTPATIENT_FETCH` を表示（missingMaster=true / dataSourceTransition=snapshot）。

## 不整合の一覧
- なし（UI の readOnly/反映停止表示・バッジ・監査イベントの runId/状態が一致）

## 代表スクリーンショット
- `artifacts/validation/readonly/screenshots/patients_server-ok.png`
- `artifacts/validation/readonly/screenshots/charts_server-ok.png`
- `artifacts/validation/readonly/screenshots/patients_missing-master-server.png`
- `artifacts/validation/readonly/screenshots/charts_missing-master-server.png`
- `artifacts/validation/readonly/screenshots/patients_fallback-used.png`
- `artifacts/validation/readonly/screenshots/charts_fallback-used.png`
- `artifacts/validation/readonly/screenshots/patients_snapshot-missing-master.png`
- `artifacts/validation/readonly/screenshots/charts_snapshot-missing-master.png`

## 実行ログの保存先
- `artifacts/validation/readonly/logs/`
- `artifacts/validation/readonly/screenshots/`
- `artifacts/validation/readonly/README.md`（サマリとrunId一覧）

## 証跡最低要件
- 状態遷移の確認表（readOnly/missingMaster/fallback/dataSourceTransition）
- 監査イベントの確認メモ（runId/状態/画面）
- 代表ケースのスクリーンショット
