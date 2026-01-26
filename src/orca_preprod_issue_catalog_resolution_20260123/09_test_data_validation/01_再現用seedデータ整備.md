# 01 再現用 seed データ整備

- RUN_ID: 20260126T124251Z
- 作業日: 2026-01-26
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/01_再現用seedデータ整備.md
- 対象IC: IC-62
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - src/validation/E2E_統合テスト実施.md
  - src/validation/ORCA実環境連携検証.md

## 目的
受付/診療/会計/帳票の主要シナリオを **同一 seed で再現可能** にし、E2E 実行の属人化を排除する。

## seed 定義（シナリオ一覧）
- 施設: `1.3.6.1.4.1.9414.72.103` (Modernized Clinic)
- 利用者: `1.3.6.1.4.1.9414.72.103:doctor1`
- 受付日: **seed 実行日の当日**（`current_date` を使用）

| シナリオ | patientId | 患者名 | 受付時刻 | PVT 状態 | 文書種別 | 文書タイトル | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 受付 | 10010 | 受付 再現 | 09:10 | 0 (待機) | - | - | 受付一覧の再現用 |
| 診療 | 10011 | 診療 再現 | 09:20 | 8 (BIT_TREATMENT) | karte | 診療サマリ seed | 診療記録の再現用 |
| 会計 | 10012 | 会計 再現 | 09:30 | 2 (BIT_SAVE_CLAIM) | karte | 会計サマリ seed | 会計済みの再現用 |
| 帳票 | 10013 | 帳票 再現 | 09:40 | 2 (BIT_SAVE_CLAIM) | letter | 帳票サマリ seed | 帳票導線の再現用 |

> 文書は `d_document` へ最小構成で投入する。ORCA 実データは別タスク (`02_ORCAデータ準備手順`) に従う。

## ガード/重複対策（汚染防止）
- 影響範囲は **patientId=10010/10011/10012/10013** と **current_date** に限定。
- `d_patient_visit` は当日分のみ削除→再投入（過去日・他患者には影響なし）。
- `d_document` は当日分の seed 文書のみ削除→再投入。
- `docid` は `md5('e2e-repro-' || patientId || '|' || doctype || '|' || current_date)` を採用し、同日再実行でも重複しない。
  - 同日に別 docid で再生成したい場合は、プレフィックスに RUN_ID を加える設計案（例: `md5('e2e-repro-'||RUN_ID||'|'||...)`）で拡張する。

## 追加 seed ファイル
- `ops/db/local-baseline/e2e_repro_seed.sql`
  - `d_patient_visit` と `d_document` を追加するシナリオ seed。
  - `local_synthetic_seed.sql` の適用が前提。
- `scripts/seed-e2e-repro.sh`
  - コンテナへの投入を自動化し、ログを `artifacts/preprod/seed/<RUN_ID>/` に保存。

## 投入手順（ローカル Modernized DB）
1. Modernized 環境を起動（worktree 専用コンテナ）。
   - 例:
     `WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19182 MODERNIZED_APP_ADMIN_PORT=19996 MODERNIZED_POSTGRES_PORT=55450 MINIO_API_PORT=19102 MINIO_CONSOLE_PORT=19103 ./setup-modernized-env.sh`
2. seed 実行（baseline + シナリオ）。
   - `RUN_ID=20260126T124251Z scripts/seed-e2e-repro.sh`
3. ログ保存先を確認。
   - `artifacts/preprod/seed/20260126T124251Z/seed-baseline.log`
   - `artifacts/preprod/seed/20260126T124251Z/seed-e2e-repro.log`

## 検証 (SQL)
```sql
SELECT patientid, fullname FROM d_patient
WHERE patientid IN ('10010','10011','10012','10013')
ORDER BY patientid;

SELECT p.patientid, v.pvtdate, v.status, v.memo
FROM d_patient_visit v
JOIN d_patient p ON p.id = v.patient_id
WHERE p.patientid IN ('10010','10011','10012','10013')
ORDER BY v.pvtdate;

SELECT p.patientid, d.doctype, d.title, d.claimdate
FROM d_document d
JOIN d_karte k ON k.id = d.karte_id
JOIN d_patient p ON p.id = k.patient_id
WHERE p.patientid IN ('10011','10012','10013')
ORDER BY d.recorded;
```

## UI/E2E 再現チェック（最低限）
| 画面名 | 確認手順 | 期待状態 | 備考 |
| --- | --- | --- | --- |
| Reception | `https://localhost:5175/f/<facilityId>/reception?sort=time&date=<today>` を開く | 一覧に `10010/10011/10012/10013` が当日分で並ぶ | Reception は ORCA `/orca/visits/list` 依存。ORCA データ未準備の場合は空表示になるため `02_ORCAデータ準備手順` を先に実施 |
| Charts | `https://localhost:5175/f/<facilityId>/charts?patientId=10011&visitDate=<today>` を開く | タイムラインに「診療サマリ seed」が表示される | URL 直指定で patientId を固定し再現性を担保 |
| Charts | `https://localhost:5175/f/<facilityId>/charts?patientId=10012&visitDate=<today>` を開く | タイムラインに「会計サマリ seed」が表示される |  |
| Charts/帳票 | `https://localhost:5175/f/<facilityId>/charts?patientId=10013&visitDate=<today>` → 印刷導線を開く | タイムラインに「帳票サマリ seed」が表示され、印刷ダイアログが開く | ORCA 帳票 API を使う場合は ORCA データ準備が必要 |

> 画面確認の証跡は `artifacts/validation/e2e/screenshots/` へ保存する。

## 実行証跡
- `artifacts/preprod/seed/20260126T124251Z/seed-baseline.log`
- `artifacts/preprod/seed/20260126T124251Z/seed-e2e-repro.log`
- `artifacts/preprod/seed/20260126T124251Z/seed-summary.md`

## 完了条件
- 上記 seed を投入後、Reception/Charts/帳票 UI の基本導線が **当日 seed で再現** できること。
- 受付/診療/会計/帳票のシナリオが E2E 実行ログで再現可能であること。

## 変更ファイル
- ops/db/local-baseline/e2e_repro_seed.sql
- scripts/seed-e2e-repro.sh
- ops/db/local-baseline/README.md
- src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/01_再現用seedデータ整備.md
