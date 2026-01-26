# seed 実行メモ

- RUN_ID: 20260126T124251Z
- 実行コマンド: `RUN_ID=20260126T124251Z scripts/seed-e2e-repro.sh`
- ログ: `seed-baseline.log` / `seed-e2e-repro.log`

## 簡易結果
- patientId=10010/10011/10012/10013 を投入
- 当日分の `d_patient_visit` を再投入
- 当日分の seed 文書を再投入（docid は `md5('e2e-repro-' || patientId || '|' || doctype || '|' || current_date)`）

## SQL 確認結果
 patientid | fullname  
-----------+-----------
 10010     | 受付 再現
 10011     | 診療 再現
 10012     | 会計 再現
 10013     | 帳票 再現
(4 rows)

 patientid |       pvtdate       | status |       memo        
-----------+---------------------+--------+-------------------
 10010     | 2026-01-26T09:10:00 |      0 | 受付シナリオ seed
 10011     | 2026-01-26T09:20:00 |      8 | 診療シナリオ seed
 10012     | 2026-01-26T09:30:00 |      2 | 会計シナリオ seed
 10013     | 2026-01-26T09:40:00 |      2 | 帳票シナリオ seed
(4 rows)

 patientid | doctype |      title      |         claimdate          |              docid               
-----------+---------+-----------------+----------------------------+----------------------------------
 10011     | karte   | 診療サマリ seed |                            | 3120594d50409828896db3c32a5b4645
 10012     | karte   | 会計サマリ seed | 2026-01-26 21:42:57.738798 | 7ec105596bc0f72ca5d68a634ae27c54
 10013     | letter  | 帳票サマリ seed | 2026-01-26 21:42:57.738798 | ce9c5dae905119413527f38237f06703
(3 rows)

## UI 確認結果（簡易）
- 実行: `E2E_BASE_URL=https://localhost:5175 node tmp/e2e-repro-ui-check.mjs`
- Reception: 画面表示は OK / 一覧は空（ORCA `/orca/visits/list` データ未準備）
- Charts: `?patientId=10011/10012/10013&visitDate=2026-01-26` で表示 → タイトル未表示
- 帳票: 印刷ボタンは disabled
- 追加ログ: `artifacts/preprod/seed/20260126T124251Z/ui-check.log`
