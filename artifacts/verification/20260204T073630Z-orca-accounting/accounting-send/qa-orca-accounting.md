# ORCA 会計送信後 class=02 再確認

- RUN_ID: 20260204T073630Z-orca-accounting
- 実施日時: 2026-02-04T07:36:51Z
- 対象: WebORCA Trial
- エンドポイント: /api01rv2/acceptlstv2?class=01 / class=02
- 前段: Web クライアント通し検証 RUN_ID=20260204T074500Z-e2e-outpatient-flow（受付送信エラー・ORCA送信 no-response）

## 結果要約

- class=01: Api_Result=00（患者ID 01415 を含む受付レコードあり）
- class=02: Api_Result=21（会計済み一覧は空）

結論:
- 会計送信後の反映は確認できず。会計送信が失敗/未実行のため、会計送信成功後に再確認が必要。

## 証跡

- acceptlstv2-request.xml
- acceptlstv2-class01.xml / acceptlstv2-class01.headers
- acceptlstv2-class02.xml / acceptlstv2-class02.headers
- targets.txt
