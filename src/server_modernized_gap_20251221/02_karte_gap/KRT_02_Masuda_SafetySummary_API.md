# KRT-02 Masuda/SafetySummary API
- 期間: 2025-12-26 11:00 - 2025-12-29 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/02_karte_gap/KRT_02_Masuda_SafetySummary_API.md`

## 目的
- SafetySummary/Masuda サポート用の REST API をモダナイズ版サーバーに実装し、Web クライアントの SafetySummaryCard / MasudaSupportPanel が必要とするデータを取得可能にする。

## スコープ
- モダナイズ版サーバーの `KarteResource` / `KarteServiceBean` に SafetySummary/Masuda API を追加する。
- DTO（SafetySummary/RoutineMed/RpHistory/UserProperty）を提供する。

## 対応内容
- `/karte/routineMed/list` と `/karte/rpHistory/list` を追加し、定期処方と処方履歴を取得できるようにする。
- `/karte/userProperty/{userId}` を追加し、ユーザー設定メモを取得できるようにする。
- SafetySummary をまとめて取得する `/karte/safety/{karteId}` を追加する。

## 実装状況
- `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`
  - `GET /karte/routineMed/list/{karteId}` と `GET /karte/routineMed.list` を実装済み。
  - `GET /karte/rpHistory/list/{karteId}` と `GET /karte/rpHistory/list` を実装済み。
  - `GET /karte/userProperty/{userId}` を実装済み。
  - `GET /karte/safety/{karteId}` を実装済み。
- `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`
  - `getRoutineMedications` / `getRpHistory` / `getUserProperties` / `getSafetySummary` を実装済み。
- `server-modernized/src/main/java/open/dolphin/rest/dto/`
  - `SafetySummaryResponse` と関連 DTO を追加済み。

## 非スコープ
- 監査ログの 200 証跡取得（別 RUN で実測・記録する）。
- Web クライアント側の UI/呼び出し追加。

## 参照
- `src/server_modernized_gap_20251221/02_karte_gap/KRT_前提ドキュメント整備.md`
- `src/predeploy_readiness/00_inventory/API・機能ギャップ台帳作成.md`
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/phase2/notes/karte-clinical-review-20251119T133348Z.md`（Legacy/Archive 参照）
