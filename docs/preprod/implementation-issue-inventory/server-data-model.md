# Preprod 実装課題インベントリ: サーバーデータモデル（受付/診療/請求/監査）

- 作業RUN_ID: 20260122T110258Z
- 対象: entity / DTO / DB スキーマの差分と永続化の問題点（server-modernized）
- 目的: 受付/診療/請求/監査イベントのマッピングと永続化の整合性を洗い出す
- 前提: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照（主要ソース）
- `common/src/main/java/open/dolphin/infomodel/PatientVisitModel.java`
- `common/src/main/java/open/dolphin/infomodel/AppointmentModel.java`
- `common/src/main/java/open/dolphin/infomodel/DocumentModel.java`
- `common/src/main/java/open/dolphin/infomodel/ModuleModel.java`
- `common/src/main/java/open/dolphin/infomodel/AuditEvent.java`
- `server-modernized/tools/flyway/sql/V0223__schedule_appo_tables.sql`
- `server-modernized/tools/flyway/sql/V0224__document_module_tables.sql`
- `server-modernized/tools/flyway/sql/V0226__audit_event_sequence_owned.sql`
- `server-modernized/tools/flyway/sql/V0227__audit_event_payload_text.sql`
- `server-modernized/tools/flyway/sql/V0227__audit_event_trace_id.sql`
- `server-modernized/src/main/resources/db/migration/V0225__alter_module_add_json.sql`
- `server-modernized/src/main/resources/db/migration/V0228__phr_key_and_async_job.sql`
- `setup-modernized-env.sh`
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `docs/server-modernization/phase2/operations/logs/20260111T215124Z-orca-trial-500-analysis.md`
- `docs/server-modernization/phase2/operations/logs/20260111T221350Z-orca-trial-karte-auto.md`
- `docs/web-client/operations/logs/20251230T081550Z-webclient-facility-prefix-09.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
- `src/validation/ORCA実環境連携検証.md`

## 重要テーブル別の差分・不整合（課題一覧）

### 受付（d_patient_visit / d_appo）
- **[Migration不足]** `server-modernized/src/main/resources/db/migration/` に `V0223__schedule_appo_tables.sql` が存在しないため、
  新規スキーマ環境では `d_patient_visit` / `d_appo` が作成されない可能性がある。
  - 影響: `/schedule/pvt` / `/appo` 系で `UnknownEntityException`、テーブル欠落が発生しうる。
- **[Entity-DB差分]** `PatientVisitModel` の `number` / `appointment` / `watingTime` が `@Transient` で永続化されない。
  - しかし `V0223__schedule_appo_tables.sql` の `d_patient_visit` には `number` / `appointment` / `watingTime` 列が存在。
  - 影響: 受付番号や予約情報・待ち時間が DB に保存されず、
    受付画面での再利用・履歴参照に差分が残る可能性。

### 診療（d_karte / d_diagnosis / d_document / d_module）
- **[Null制約違反]** `/orca/disease` / `/orca/disease/v3` で `d_diagnosis.karte_id` が NULL となり INSERT 失敗。
  - 既知事象: Karte 未生成時に 500。
  - 影響: 診療（病名）登録が永続化できず、診療履歴が欠落。
- **[Null参照/NPE]** `/orca/medical/records` で `karte == null` のまま `karte.getId()` にアクセスし 500。
  - 影響: 診療履歴取得が不可。
- **[Sequence不足]** `d_karte_seq` が存在しない場合、患者登録時に Karte 自動生成が失敗。
  - `setup-modernized-env.sh` で `d_karte_seq` を作成しているが、
    事前に DB を初期化しない環境では同じ問題が再発する。
- **[Migration不足]** `server-modernized/src/main/resources/db/migration/` に `V0224__document_module_tables.sql` が無い。
  - 影響: `d_document` / `d_module` / `d_image` / `d_attachment` が作成されず、
    カルテ・診療履歴の永続化に支障。
- **[Null制約違反]** `d_module.beanBytes` が `NOT NULL` のままの場合、
  `ModuleModel` で `bean_json` 運用（JSON保存）時に INSERT 失敗。
  - `ModuleModel` は `beanBytes` を nullable として扱い、`bean_json` を使用する設計。
  - 影響: 診療モジュール（オーダ/処方/検査）保存が失敗。

### 請求（Claim）
- **[永続化対象差分/仕様確認]** `DocInfoModel.sendClaim` / `PVTClaim` は `@Transient`。
  - 送信状態やCLAIM情報が DB に残らない設計のため、
    監査や再送制御で必要となる場合は永続化仕様の確認が必要。
- **[Migration依存]** Claim の実体保存は `d_module` の `beanBytes`/`bean_json` が前提。
  - `V0225__alter_module_add_json.sql` が未適用の環境では JSON 保存が破綻。

### 監査イベント（d_audit_event）
- **[Schema未作成]** `d_audit_event` が無い状態で API を叩くと 500。
  - 既知事象: DB 初期化未実施時に監査ログ到達が不可。
- **[Sequence不足/参照パス不整合]** `d_audit_event_id_seq` が未作成、または `search_path` の問題で参照できず 500。
  - `ALTER ROLE ... SET search_path` を手動実施して復旧した実績あり。
- **[Migration不足]** `AuditEvent` では `trace_id` を利用するが、
  `V0227__audit_event_trace_id.sql` が resources 配下に無く、列追加が反映されない恐れ。
- **[データ型不整合]** Legacy 由来の `d_audit_event.payload` が OID の場合、
  entity 定義（`text`）と不整合。
  - `V0227__audit_event_payload_text.sql` の適用が必要。

## 追加メモ（運用/初期化）
- DB 初期化は `setup-modernized-env.sh` の legacy schema dump に依存。
  - dump 不在時は `d_users` 等が作成されず、監査・受付・診療系の API が 500 になる。
- `server-modernized/tools/flyway/sql/` と `server-modernized/src/main/resources/db/migration/` の
  バージョン同期が取れていないため、適用経路を明確化する必要がある。
