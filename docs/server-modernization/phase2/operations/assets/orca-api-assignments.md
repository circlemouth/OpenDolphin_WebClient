# ORCA API 担当割当サマリ

- 本シートは `operations/ORCA_CONNECTIVITY_VALIDATION.md` の 53 API マトリクスに対応し、優先度タグ (P0/P1/P2) に対して業務ロールを即時アサインできるよう整理した。
- 受付/予約/カルテ/帳票運用での責務は [CLINICAL_MODULES.md](../../../../web-client/guides/CLINICAL_MODULES.md) の導線整理を根拠とし、通知・入院・請求のワークフロー分担は [RESERVATION_BATCH_MIGRATION_NOTES.md](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md) のフロー定義を参照している。
- ロール定義: 受付オペレーション/予約コーディネータは `§2 受付・予約・サマリ運用` を、診療担当（カルテ）は `§3 カルテ補助パネル` と `§4 スタンプと ORCA 連携` を、入院担当は `§2 予約状態遷移`・`§3 通知処理フロー` を、会計担当は `§3 通知処理フロー` の CLAIM 送信を、マスタ管理は `§1 Jakarta 化差分` や `§4 オーダーデータ要件` を、バックオフィス（帳票）は `§5 文書・シェーマ` を根拠とする。

| No | 優先度 | 推奨担当 | 参照資料リンク |
| --- | --- | --- | --- |
| 1 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 2 | P0 | 予約コーディネータ | [CLINICAL_MODULES §2.2](../../../../web-client/guides/CLINICAL_MODULES.md#22-予約管理-appointmentmanager) |
| 3 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §3](../../../../web-client/guides/CLINICAL_MODULES.md#3-カルテ補助パネル) |
| 4 | P0 | 受付オペレーション | [CLINICAL_MODULES §2.1](../../../../web-client/guides/CLINICAL_MODULES.md#21-受付一覧と詳細ドロワ) |
| 5 | P0 | 受付オペレーション | [CLINICAL_MODULES §2.1](../../../../web-client/guides/CLINICAL_MODULES.md#21-受付一覧と詳細ドロワ) |
| 6 | P0 | 予約コーディネータ | [CLINICAL_MODULES §2.3](../../../../web-client/guides/CLINICAL_MODULES.md#23-施設予約一覧-facilityschedulepage) |
| 7 | P1 | マスタ管理 | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 8 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 9 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 10 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 11 | P1 | マスタ管理 | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 12 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §3](../../../../web-client/guides/CLINICAL_MODULES.md#3-カルテ補助パネル) |
| 13 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 14 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 15 | P0 | 予約コーディネータ | [CLINICAL_MODULES §2.2](../../../../web-client/guides/CLINICAL_MODULES.md#22-予約管理-appointmentmanager) |
| 16 | P0 | 会計担当 | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 17 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §3](../../../../web-client/guides/CLINICAL_MODULES.md#3-カルテ補助パネル) |
| 18 | P0 | 受付オペレーション | [CLINICAL_MODULES §2.1](../../../../web-client/guides/CLINICAL_MODULES.md#21-受付一覧と詳細ドロワ) |
| 19 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 20 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 21 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 22 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 23 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 24 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 25 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 26 | P1 | 会計担当 | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 27 | P0 | 会計担当 | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 28 | P2 | マスタ管理 | [RESERVATION_NOTES §1](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#1-javax-jakarta-置換対象と設計差分) |
| 29 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 30 | P1 | 会計担当 | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 31 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 32 | P2 | マスタ管理 | [RESERVATION_NOTES §1](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#1-javax-jakarta-置換対象と設計差分) |
| 33 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.3](../../../../web-client/guides/CLINICAL_MODULES.md#43-order-セットとテンプレート) |
| 34 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 35 | P0 | 会計担当 | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 36 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 37 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 38 | P1 | 会計担当 | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 39 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 40 | P1 | 会計担当 | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 41 | P0 | 受付オペレーション | [RESERVATION_NOTES §3](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#3-通知処理フロー静的整理) |
| 42 | P2 | バックオフィス（帳票） | [CLINICAL_MODULES §5](../../../../web-client/guides/CLINICAL_MODULES.md#5-文書シェーマテンプレート) |
| 43 | P2 | マスタ管理 | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 44 | P2 | マスタ管理 | [RESERVATION_NOTES §1](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#1-javax-jakarta-置換対象と設計差分) |
| 45 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 46 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.4](../../../../web-client/guides/CLINICAL_MODULES.md#44-オーダーデータ要件) |
| 47 | P1 | 入院担当 | [RESERVATION_NOTES §2](../../domains/RESERVATION_BATCH_MIGRATION_NOTES.md#2-予約状態遷移静的図) |
| 48 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 49 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 50 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §3](../../../../web-client/guides/CLINICAL_MODULES.md#3-カルテ補助パネル) |
| 51 | P1 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
| 52 | P0 | 診療担当（カルテ） | [CLINICAL_MODULES §4.2](../../../../web-client/guides/CLINICAL_MODULES.md#42-orca-マスター検索と禁忌チェック) |
| 53 | P0 | 受付オペレーション | [CLINICAL_MODULES §1](../../../../web-client/guides/CLINICAL_MODULES.md#1-患者情報編集-patientspage) |
