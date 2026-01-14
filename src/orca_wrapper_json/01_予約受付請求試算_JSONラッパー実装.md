# 01_予約受付請求試算_JSONラッパー実装
- 期間: 2026-01-14 15:00 - 2026-01-16 15:00 / 優先度: high / 緊急度: high
- YAML ID: `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
- RUN_ID: 20260114T020321Z

## 対象API
- `/orca/appointments/list`
- `/orca/appointments/patient`
- `/orca/billing/estimate`
- `/orca/appointments/mutation`
- `/orca/visits/list`
- `/orca/visits/mutation`

## 実装内容
- 予約一覧 API の日付バリデーションを `appointmentDate` 単体必須から `appointmentDate/fromDate/toDate` いずれか必須へ更新。
- `OrcaWrapperService#getAppointmentList` の日付レンジ解釈を補正し、`toDate` 単独指定時も範囲として処理できるように調整。
- 6 系統の JSON ラッパー応答について、Stub を使った DTO 変換の単体テストを追加。
  - Api_Result / Api_Result_Message の受け渡しが崩れていないことを確認。

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-unused-features.md`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaAppointmentResource.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaVisitResource.java`
- `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java`
- `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaEndpoint.java`
- `server-modernized/src/main/resources/orca/stub/*.xml`

## 検証
- `mvn -pl server-modernized -DskipTests=false test` を実行し、追加テストの成功を確認する。
