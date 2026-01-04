# 入力バリデーション妥当性確認 - 証跡

- RUN_ID: 20260104T023029Z
- 実施日: 2026-01-04
- 環境: MODERNIZED_APP_HTTP_PORT=19085 / MODERNIZED_POSTGRES_PORT=56010 / MINIO_API_PORT=9200

## 取得ログ
- 病名 patientId 欠落: `logs/disease_missing_patientid_400_headers.txt`, `logs/disease_missing_patientid_400_body.json`
- 監査イベント一覧: `logs/audit_event_recent.txt`
- サーバーログ抜粋: `logs/server_recent.log`
- 404（/orca/order/bundles）: `logs/order_bundle_missing_patientid_400_headers.txt`

## 補足
- d_audit_event / d_facility / d_users / d_roles を最小構成で投入し、ヘッダ認証と監査記録を通すための初期化を実施。
