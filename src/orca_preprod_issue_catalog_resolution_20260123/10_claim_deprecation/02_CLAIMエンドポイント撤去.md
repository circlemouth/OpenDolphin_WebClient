# 02 CLAIM エンドポイント撤去

## RUN_ID
- 20260126T124235Z

## 目的
- CLAIM 依存 REST エンドポイントと関連 DTO/テストを server-modernized から撤去し、登録ルーティングを整理する。

## 対応内容
- `/orca/claim/outpatient` の実装・DTO・テストを削除。
- `/schedule/document` の REST エンドポイントを削除。
- `/karte/diagnosis/claim` `/karte/claim` `/serverinfo/claim/conn` `/claim/conn` は server-modernized 側に実装が存在しないため追加対応なし（登録されない状態を確認）。

## 変更内容
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaClaimOutpatientResource.java` を削除。
- `server-modernized/src/main/java/open/dolphin/rest/dto/outpatient/ClaimOutpatientResponse.java` を削除。
- `server-modernized/src/test/java/open/dolphin/orca/rest/OrcaClaimOutpatientResourceTest.java` を削除。
- `server-modernized/src/main/java/open/dolphin/rest/ScheduleResource.java` から `/document` POST を削除。

## 検証
- 未実施（ルーティング削除のため再起動時に未登録となることを前提）。

## 備考
- `ScheduleServiceBean#makeScheduleAndSend` は呼び出し元が無くなったため未使用となるが、後続タスクで整理予定。
