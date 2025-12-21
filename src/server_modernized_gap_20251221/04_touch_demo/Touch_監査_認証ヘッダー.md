# Touch 監査/認証ヘッダー
- 期間: 2025-12-27 15:00 - 2025-12-29 15:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Touch_監査_認証ヘッダー.md`

## 目的
- Touch/Demo の必須ヘッダー検証を共通化し、認証・監査の判定を揃える。
- 監査ログ（閲覧/更新/失敗）の記録方法を整理し、Touch API の監査イベントを一貫化する。

## スコープ
- `server-modernized/src/main/java/open/dolphin/touch/` の認証/監査補助。
- Touch/Demo のヘッダー検証と監査ログの整備（成功・失敗の両方）。

## 対応内容
- TouchAuthHandler の必須ヘッダー統一
  - `X-Facility-Id` / `X-Access-Reason` / `X-Consent-Token` / `X-Trace-Id` / `X-Device-Id` / `X-Demo-Mode` を Touch 向け標準ヘッダーとして定義。
  - `userName` / `password` / `clientUUID` を認証ヘッダーとして整理し、共通の検証メソッドで扱う。
  - 欠落時は監査失敗イベントを記録し、HTTP ステータスを統一する。
- 監査ログの整備
  - Touch 系の閲覧系 API で `TOUCH_*_VIEW` の監査イベントを成功/失敗ともに記録する。
  - 監査詳細には `status` / `reason` / `errorCode` / `facilityId` / `userId` を共通で出力する。
  - 失敗時は `status=failed` をセットし、JMS/監査の Outcome を FAILURE で揃える。

## 作業内容
1. TouchAuthHandler のヘッダー定義と必須チェックを共通化
   - 必須ヘッダーの定数化
   - 欠落時の監査失敗ログを統一
2. Touch 監査ヘルパーの拡張
   - 成功/失敗の両パスで監査が記録できる API を追加
3. Touch/Demo の主要サービスで失敗監査を追加
   - 失敗時の `reason` / `httpStatus` / `errorMessage` を監査へ残す

## 非スコープ
- Phase2 文書の更新
- ORCA 実環境接続や Stage/Preview 実測

## 変更ファイル（予定）
- `server-modernized/src/main/java/open/dolphin/touch/TouchAuthHandler.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchAuditHelper.java`
- `server-modernized/src/main/java/open/dolphin/touch/user/TouchUserService.java`
- `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientService.java`
- `server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampService.java`
- `server-modernized/src/main/java/open/dolphin/touch/user/TouchUserResource.java`

## 留意点
- Phase2/Legacy 文書は参照のみ。
- Web クライアントとモダナイズ版サーバーは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を前提。
- ORCA 接続は本タスク対象外。

## 参照
- `src/server_modernized_gap_20251221/00_factcheck/現状棚卸し_ギャップ確定.md`
- `src/server_modernized_gap_20251221/04_touch_demo/Touch_前提ドキュメント整備.md`
