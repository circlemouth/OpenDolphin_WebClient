# 02 ORCA データ準備手順

- RUN_ID: 20260126T214708Z
- 作業日: 2026-01-26
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/02_ORCAデータ準備手順.md
- 対象IC: IC-63
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md
  - docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md

## 実ORCA接続方針（本ガント統一）
- 実ORCA検証は `docker/orca/jma-receipt-docker` のローカル WebORCA を使用する。
- 接続先: `http://localhost:8000/`
- 認証: Basic `ormaster` / `change_me`（証明書認証なし）
- `server-modernized` からは `ORCA_API_HOST=host.docker.internal` を使用し、コンテナからホストの 8000 に到達させる。
  - 併用設定: `ORCA_API_SCHEME=http`, `ORCA_API_PORT=8000`, `ORCA_MODE=weborca`
- コンテナ未起動時はサブモジュールで `docker compose up -d` を実行する。

## 目的
- ORCA Trial/実環境のデータ準備とリセット手順を、**実環境検証を再現可能**な粒度で整備する。
- **機微情報は一切記載しない**（実値は `<MASKED>`、入手は `ORCA_CERTIFICATION_ONLY.md` に従う）。

## 注意事項（Trial/実環境共通）
- Trial は公開環境であり、**実在の医療機関/患者情報は登録しない**。
- Trial の登録データは **管理者により定期的に消去**される。
- Preprod/Prod の直接 DB 操作は禁止。操作は **ORCA 提供の手順・UI・API**に限定する。
- 証跡は `artifacts/orca-preprod/<RUN_ID>/` に保存し、機微情報は `<MASKED>` で置換する。

## データ準備の成果物（テンプレ）
### 1. 収集対象（再現用メタ）
- ORCA 環境: Trial / Preprod / Prod / Local WebORCA
- Base URL: `<MASKED>`
- 認証方式: Basic / mTLS
- 施設情報: 施設名/コード（<MASKED>）
- 生成データ:
  - 患者ID / 氏名 / 生年月日 / 性別（<MASKED>）
  - 医師コード / 診療科 / 受診日
  - 診療行為 / 病名 / 処方 / 帳票種別
- 取得証跡:
  - API リクエスト/レスポンス（XML/JSON）
  - UI スクリーンショット
  - runId / traceId（Web クライアント/サーバーログ）

### 2. 証跡ディレクトリ（作成例）
```
artifacts/orca-preprod/<RUN_ID>/
  orca-data-prep.md
  requests/
  responses/
  screenshots/
  logs/
```

## 実施手順（環境別）
### A. Local WebORCA（docker）
1. サブモジュール取得（未取得時）:
   - `git submodule update --init docker/orca/jma-receipt-docker`
2. コンテナ起動:
   - `cd docker/orca/jma-receipt-docker`
   - `docker compose up -d`
3. UI でデータ作成（推奨）:
   - 患者登録 → 受付 → 診療行為入力 → 会計/帳票プレビューまで実施。
4. API でデータ確認（任意）:
   - ORCA API サンプル（XML/UTF-8）を送信し、Api_Result=00 を確認。
   - 送信テンプレは `docs/server-modernization/operations/ORCA_FIRECRAWL_INDEX.md` を入口に参照。

### B. Trial WebORCA（公開環境）
1. 接続情報は `ORCA_CERTIFICATION_ONLY.md` を参照（本書では `<MASKED>`）。
2. 既存のサンプルデータを **参照優先**で利用する。
3. 追加登録が必要な場合は **架空データのみ**を登録し、登録内容は必ず記録する。
4. データが失われた場合は **定期リセットを前提**に再作成する。

### C. Preprod / Prod（実環境）
1. 接続情報は `ORCA_CERTIFICATION_ONLY.md` を参照。
2. **承認済みの検証窓口**を通して実施し、直接 DB 操作は行わない。
3. データ準備:
   - 既存データの確認 → 追加が必要な場合のみ最小入力で登録。
4. リセット:
   - ORCA 運用担当の指示に従い、バックアップ/リストアまたは正式な削除手順で復旧。

## 再現用 SQL（Local WebORCA 限定）
> Trial / Preprod / Prod では **SQL 実行禁止**。Local WebORCA でのみ使用する。

```sql
-- 実行前に ORCA DB スキーマを確認すること。
-- 参照先: docs/server-modernization/phase2/operations/assets/orca-db-schema/README.md (Legacy 参照)
BEGIN;
-- 例: テスト患者IDだけを削除する場合（テーブル名は要確認）
-- DELETE FROM <patient_table> WHERE patient_id IN (<TEST_PATIENT_IDS>);
-- DELETE FROM <visit_table> WHERE patient_id IN (<TEST_PATIENT_IDS>);
-- DELETE FROM <disease_table> WHERE patient_id IN (<TEST_PATIENT_IDS>);
-- DELETE FROM <order_table> WHERE patient_id IN (<TEST_PATIENT_IDS>);
COMMIT;
```

## リセット手順（環境別）
### Local WebORCA
- フルリセット（推奨）:
  - `docker compose down -v` → `docker compose up -d`
- 部分リセット（SQL を使う場合）:
  - 上記 SQL テンプレにテーブル/患者IDを埋めて実行。

### Trial
- 管理者の **定期削除**で全データが消去される。
- 直近の検証で必要な場合は再作成し、runId と合わせて証跡を保存。

### Preprod / Prod
- ORCA 運用チームの承認と指示に従う。
- データ復旧は **バックアップ/リストア**または正式な削除手順のみ。

## 実施内容
### 2026-01-26 実施（Local WebORCA）
- RUN_ID: 20260126T214708Z
- 目的: IC-62 seed UI 確認用に Local WebORCA のデータを準備
- 実施内容:
  - `patientmodv2?class=01` で患者登録（採番: 00005/00006/00007/00008、Api_Result=K0）
  - `/orca/visits/mutation` で受付登録（Api_Result=00）
  - `/orca/visits/list` で受付一覧確認（Api_Result=13, recordsReturned=0）
- 証跡: `artifacts/orca-preprod/20260126T214708Z/`（`orca-data-prep.md`, `requests/`, `responses/`, `logs/`）
- UI 再確認ログ: `artifacts/preprod/seed/20260126T214708Z/ui-check.log`
- 補足: visit list が空のため、Reception UI は空表示のまま。ORCA 側の来院一覧生成条件（tbl_jyurrk/view_q004 反映）を別途確認する。

### 許容メモ（今回の証跡扱い）
- Local WebORCA の受付一覧が空のため、**今回は Trial 側の正常ケースを証跡として採用**する。
- 既存の正常ケース証跡（2026-01-04, RUN_ID=20260104T225149Z）:
  - 外来一覧: `artifacts/orca-connectivity/20260104T225149Z/api/appointment_outpatient_list_body.json`（recordsReturned=1）
  - Reception 画面: `artifacts/orca-connectivity/20260104T225149Z/screenshots/reception.png`
  - 検証記録: `src/validation/ORCA実環境連携検証.md`
