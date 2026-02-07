# ORCA 会計送信結果確認（acceptlstv2）

- RUN_ID: 20260204T072850Z-orca-accounting
- 実施日時: 2026-02-04T07:28:51Z
- 対象: WebORCA Trial
- エンドポイント: `/api01rv2/acceptlstv2?class=01` `/api01rv2/acceptlstv2?class=02`

## 結果要約

- class=01（受付一覧）: Api_Result=00。患者ID `01415`（受付時刻 05:49:35）を含む受付レコードあり。
- class=02（会計済み一覧）: Api_Result=21（対象の受付はありませんでした）。

結論:
- ORCA 側では会計済み（class=02）への反映は確認できず。会計送信実行後に再確認が必要。

## 証跡

- `acceptlstv2-request.xml`
- `acceptlstv2-class01.xml` / `acceptlstv2-class01.headers`
- `acceptlstv2-class02.xml` / `acceptlstv2-class02.headers`
- `targets.txt`
