# ORCA API 互換テスト実行ログ

RUN_ID: 20260105T142945Z
実行日: 2026-01-05 (JST)

## 前提/参照
- 参照: docs/DEVELOPMENT_STATUS.md
- 接続手順: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md
- 接続先: WebORCA Trial (https://weborca-trial.orca.med.or.jp)
- 認証: Basic (trial / <MASKED>)
- 方式: API-only

## 環境準備
- 起動
  - WEB_CLIENT_MODE=npm MINIO_API_PORT=29010 MINIO_CONSOLE_PORT=29011 MODERNIZED_POSTGRES_PORT=65434 MODERNIZED_APP_HTTP_PORT=9085 MODERNIZED_APP_ADMIN_PORT=9994 ./setup-modernized-env.sh
- Modernized DB 初期化
  - Hibernate によるスキーマ生成が無効だったため、コンテナ内 WAR の persistence.xml を一時的に schema-generation=create へ更新して再起動。
  - 生成後、opendolphin スキーマと opendolphin.hibernate_sequence を追加し、KarteServiceBean が参照するシーケンスエラーを解消。
  - 実行ログ: artifacts/orca-connectivity/20260105T142945Z/db/opendolphin_schema_sequence.log

## DB シード/補正
- ローカル合成シード投入: ops/db/local-baseline/local_synthetic_seed.sql
  - artifacts/orca-connectivity/20260105T142945Z/db/local_synthetic_seed.log
- 追加ユーザー: dolphindev (md5) を補助登録
  - artifacts/orca-connectivity/20260105T142945Z/db/modern_user_seed.{sql,log}
- API-only フロー用患者のカルテ/PVT補正
  - 患者: patientId=000101 (facility=LOCAL.FACILITY.0001)
  - artifacts/orca-connectivity/20260105T142945Z/db/karte_visit_for_patient_000101.{sql,log}

## 正常系（API-only 診療フロー）
- POST /orca/patient/mutation (create)
  - HTTP 200 / apiResult=00
  - artifacts/orca-connectivity/20260105T142945Z/normal/patient_mutation.*
- POST /orca/disease (create)
  - HTTP 200 / apiResult=00
  - artifacts/orca-connectivity/20260105T142945Z/normal/disease_mutation_ok.*
- POST /orca/order/bundles (create)
  - HTTP 200 / apiResult=00
  - artifacts/orca-connectivity/20260105T142945Z/normal/order_bundle_create_ok.*
- POST /orca/medical/records
  - HTTP 200 / apiResult=00 (records 1件)
  - artifacts/orca-connectivity/20260105T142945Z/normal/medical_records_ok.*
- POST /orca21/medicalmodv2/outpatient
  - HTTP 200 / outcome=SUCCESS
  - artifacts/orca-connectivity/20260105T142945Z/normal/outpatient_ok.*

## 異常系
- /orca/patient/mutation (operation 不正)
  - HTTP 400
  - artifacts/orca-connectivity/20260105T142945Z/errors/patient_mutation_invalid_operation.*
- /orca/disease (diagnosisName 空)
  - HTTP 400
  - artifacts/orca-connectivity/20260105T142945Z/errors/disease_mutation_empty_name.*
- /orca/order/bundles GET (entity 不正)
  - HTTP 400
  - artifacts/orca-connectivity/20260105T142945Z/errors/order_bundle_invalid_entity.*
- /orca/medical/records (patientId 欠落)
  - HTTP 400
  - artifacts/orca-connectivity/20260105T142945Z/errors/medical_records_missing_patient.*
- ORCA API Basic 認証エラー (Trial)
  - POST https://weborca-trial.orca.med.or.jp/api01rv2/system01dailyv2
  - HTTP 401
  - artifacts/orca-connectivity/20260105T142945Z/errors/orca_system01dailyv2_invalid_basic.*

## 途中障害と復旧
- 症状: /orca/disease・/orca/order/bundles が 500 (Session layer failure)
- 原因: opendolphin スキーマの hibernate_sequence 参照が欠落 (schema "opendolphin" does not exist)
- 対応:
  - opendolphin スキーマ + opendolphin.hibernate_sequence 作成
  - artifacts/orca-connectivity/20260105T142945Z/db/opendolphin_schema_sequence.{sql,log}
- 結果: 再実行で正常系 API が 200 に復帰

## 証跡ディレクトリ
- artifacts/orca-connectivity/20260105T142945Z/
