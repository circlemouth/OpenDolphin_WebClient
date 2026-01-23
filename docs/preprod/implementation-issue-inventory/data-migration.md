# 初期データとマイグレーション（preprod 実装課題インベントリ）

- RUN_ID: 20260122T102944Z
- 作業日: 2026-01-22
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/04_data_quality_review/01_初期データとマイグレーション.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769079834244-5a296d
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `docs/server-modernization/persistence-layer/3_4-persistence-layer-modernization.md`
- `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
- `setup-modernized-env.sh`（初期化/seed/シーケンス作成ロジック）
- `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/legacy_schema_dump.sql`
- `ops/db/local-baseline/README.md` / `ops/db/local-baseline/local_synthetic_seed.sql`
- `docs/server-modernization/phase2/operations/logs/20260111T205439Z-orca-trial-coverage.md`
- `docs/server-modernization/phase2/operations/logs/20260111T213428Z-orca-trial-coverage.md`
- `docs/server-modernization/phase2/operations/logs/20260111T215124Z-orca-trial-500-analysis.md`
- `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md`
- `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md`
- `src/validation/ORCA実環境連携検証.md`

## 現行の初期化フロー（事実整理）
- `setup-modernized-env.sh` が起動時に DB 初期化を実施。
  - 既存判定: `d_users` テーブル有無で初期化済みか判定。
  - Legacy schema dump 適用: `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/legacy_schema_dump.sql`
  - search_path 設定: `ALTER ROLE opendolphin SET search_path TO opendolphin,public;`
  - 追加シーケンス作成: `d_patient_seq`, `d_karte_seq`（`CREATE SEQUENCE IF NOT EXISTS`）
- 初期 seed:
  - `apply_baseline_seed` → `ops/db/local-baseline/local_synthetic_seed.sql`
  - `register_initial_user` → facility/user/roles を SQL で挿入し、`hibernate_sequence` を調整

## 初期化/移行の不足で発生した API 失敗（インベントリ）
| # | 未整備ポイント | 影響/API 失敗 | 再現手順（要約） | 証跡/参照 |
| --- | --- | --- | --- | --- |
| 1 | DB スキーマ未初期化（legacy schema dump 未適用） | `/api/*` が HTTP 500。`d_audit_event` 等が無く監査ログ書き込みで例外。 | `OPENDOLPHIN_SCHEMA_ACTION=create WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、`/api/user` などにアクセス | `docs/server-modernization/phase2/operations/logs/20260111T205439Z-orca-trial-coverage.md` / `src/validation/ORCA実環境連携検証.md`（RUN_ID=20260104T200022Z） |
| 2 | `d_karte_seq` 不在 | `/orca/patient/mutation` が 500（Karte 自動生成時に seq 不在）。 | Schema dump だけで起動し患者登録を実行。`d_karte_seq` 未作成だと失敗。 | `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md` |
| 3 | `search_path` が `opendolphin` のみ（public が除外） | `d_audit_event_id_seq` が参照できず 500。 | schema-only を投入後に `ALTER ROLE opendolphin SET search_path TO opendolphin;` の状態でログイン/API 実行。 | `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md` |
| 4 | facility/patient/karte の初期データ不足 | `/orca/disease`, `/orca/disease/v3`, `/orca/medical/records` が 500（karte 未生成/NoResult） | seed なしで患者作成後に病名/診療履歴 API を実行 | `docs/server-modernization/phase2/operations/logs/20260111T215124Z-orca-trial-500-analysis.md` |
| 5 | facility/patient 紐付け不足 | `/orca/billing/estimate`, `/orca/patients/batch` が 500（local DB 側の関連不足＋Trial 側 500） | seed/データ未投入で batch/estimate を実行 | `docs/server-modernization/phase2/operations/logs/20260111T213428Z-orca-trial-coverage.md` / `docs/server-modernization/phase2/operations/logs/20260111T215124Z-orca-trial-500-analysis.md` |

## 追加の観察事項（要整理）
- legacy schema dump は `opendolphin` / `public` の双方に同名テーブルを含む（例: `d_audit_event`）。search_path の順序次第で参照先が変わるため、初期化時は `opendolphin,public` を保証する必要がある。
- `apply_baseline_seed` は `d_facility` が存在しない場合にスキップするため、schema dump 未適用時は seed が実行されずログイン/監査が全滅する。
- `local_synthetic_seed.sql` は facility/user/roles の最小 seed であり、患者/karte の初期データは含まれない（患者系 API の 500 が残存）。

## まとめ（課題の明確化）
- preprod 初期化の最優先課題は「legacy schema dump の確実な適用」と「search_path の固定化」。
- 追加シーケンス（`d_patient_seq`, `d_karte_seq`, `hibernate_sequence`）が欠落すると患者登録や Karte 自動生成が失敗する。
- seed は最小限の facility/user に留まるため、患者・Karte を前提にする API は別途 seed/データ投入が必要。

## SCHEMA_DUMP_FILE の取得元・生成手順
- 期待パス（既定）: `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/legacy_schema_dump.sql`
- `setup-modernized-env.sh` では `SCHEMA_DUMP_FILE` を未指定の場合、上記既定パスを参照する。
- 生成手順（例）:
  1. Legacy DB コンテナを起動 (`docker compose up -d db` 等)。
  2. 既存スキーマを整理後、`pg_dump --schema-only --no-owner --no-privileges` で schema dump を取得。
  3. 取得した `legacy_schema_dump.sql` を `artifacts/parity-manual/db-restore/<RUN_ID>/` に保存し、既定パスへコピーするか `SCHEMA_DUMP_FILE` で参照先を指定する。
- 取得元・証跡:
  - 2025-11-20 取得分の証跡: `artifacts/parity-manual/db-restore/20251120TbaselineGateZ1/`
  - 既定パスを変更する場合は `SCHEMA_DUMP_FILE=/absolute/or/relative/path/to/legacy_schema_dump.sql` を指定する。

## 次のアクション候補（判断待ち）
1. preprod で legacy schema dump を適用済みかを確認するチェックリストを `setup-modernized-env.sh` のログ/exit 条件に追加する。
2. `search_path` を `opendolphin,public` に固定する再設定手順を手順書に明記する。
3. 患者/karte の最小 seed（ダミー患者 + Karte 作成）を preprod 用 seed に追加する。
