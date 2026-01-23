# 参照整合とID採番制約（preprod 実装課題インベントリ）

- RUN_ID: 20260123T000252Z
- 作業日: 2026-01-23
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/04_data_quality_review/03_参照整合とID採番制約.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769126493674-c3043e
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 目的
- 参照整合/ユニーク制約/ID 採番の問題点を抽出し、再現条件と修正方針を整理する。

## 参照（正本/補助）
- `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md`
- `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_前提ドキュメント整備.md`
- `docs/preprod/implementation-issue-inventory/server-data-model.md`
- `docs/preprod/implementation-issue-inventory/data-migration.md`
- `docs/preprod/implementation-issue-inventory/data-transactions.md`

## 課題一覧（参照整合/採番/ユニーク制約）

| # | 問題点 | 影響（500/不整合） | 再現条件 | 修正方針（案） | 参照 |
| --- | --- | --- | --- | --- | --- |
| 1 | `d_karte_seq` 不在 | `/orca/patient/mutation` で Karte 自動生成が失敗し 500。後続の病名/診療履歴が連鎖的に失敗。 | schema dump だけで起動し患者登録を実行。`d_karte_seq` が無い環境。 | 起動時に `d_karte_seq` を必ず作成（`setup-modernized-env.sh` の初期化前提を明文化）。seed で患者/karte を用意する場合は二重作成を防ぐ。 | `docs/preprod/implementation-issue-inventory/data-migration.md` / `docs/preprod/implementation-issue-inventory/data-transactions.md` |
| 2 | `hibernate_sequence`/`opendolphin` スキーマ欠落 | `/orca/disease`・`/orca/order/bundles` が 500（Session layer failure）。schema/sequence 欠落で永続化が失敗。 | DB 初期化が schema-only、または `opendolphin` スキーマ/`hibernate_sequence` 未作成の状態で API を実行。 | 初期化手順で `opendolphin` スキーマと `hibernate_sequence` を必須化し、差分がある場合は自動作成ログを残す。 | `docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md` |
| 3 | `d_audit_event_id_seq` の参照パス不整合 | 監査ログ書き込みが 500（sequence 参照不可）。 | `search_path` が `opendolphin` のみで `public` が除外されている状態でログイン/API 実行。 | `ALTER ROLE opendolphin SET search_path TO opendolphin,public;` を起動時に保証。schema dump の順序と検索パスを固定する。 | `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md` / `docs/preprod/implementation-issue-inventory/data-migration.md` |
| 4 | `d_diagnosis.karte_id` の NULL 参照 | `/orca/disease` 系が 500（Null 制約違反）、病名が永続化できない。 | 患者作成時に Karte 未生成、または Karte 参照が欠落した状態で病名 API を実行。 | 患者作成と Karte 生成の前提を API 側で明示し、Karte 未生成時は 400/404 を返す。Karte 生成失敗時は retry 前に原因を明示。 | `docs/preprod/implementation-issue-inventory/server-data-model.md` |
| 5 | `karte == null` の参照 | `/orca/medical/records` が 500（NPE）。 | Karte 参照が未生成/欠落の患者で診療履歴取得を実行。 | Karte 不在時の例外を 404/empty へ変換し、前提データ生成（patient+karte）を seed に含める。 | `docs/preprod/implementation-issue-inventory/server-data-model.md` |
| 6 | 患者のユニーク制約（`d_patient(facilityid, patientid)`）と再試行 | 患者作成の再試行で DB 例外（重複）や ORCA/local の不整合が発生。 | `/orca/patient/mutation` の再試行で同一 patientId を投入。API 側で idempotency が無い。 | 再試行前に既存患者検索で重複回避し、API 側の冪等化（既存時は 200/409 など方針決定）を検討。 | `docs/preprod/implementation-issue-inventory/data-transactions.md` |
| 7 | 施設/ユーザー/患者の紐付け不足 | ログインや患者関連 API が 500/404。施設プレフィックス無しの userId でログイン不可。 | `d_facility`/`d_users`/患者の seed が無い状態でログインや患者 API を実行。 | facilityId を前提に userId を `facilityId:userId` 形式へ統一し、初期 seed を最低限の facility/user/patient+karte まで拡張。 | `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md` / `docs/preprod/implementation-issue-inventory/data-migration.md` |

## 参照整合の要点（整理）
- ID 採番と参照整合の前提（`d_karte_seq`/`hibernate_sequence`/`d_audit_event_id_seq`）が欠けると 500 が発生し、再試行時に重複や部分成功が残る。
- 施設・患者・カルテの紐付けは前提データ（facility/user/patient/karte）に強く依存するため、seed/初期化時点で最低限の紐付けを保証する必要がある。

## 追加確認が必要なポイント（未実施）
1. preprod 起動時に `search_path` が必ず `opendolphin,public` になっているかの検証（起動ログ or healthcheck）。
2. `d_karte_seq`/`hibernate_sequence` など必須シーケンスが欠落した場合の自動修復の有無。
3. `/orca/patient/mutation` の再試行時に 409/200 を返す運用方針（idempotency）の決定。
