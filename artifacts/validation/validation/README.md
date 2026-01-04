# 入力バリデーション妥当性確認 - 証跡

- RUN_ID: 20260104T063803Z
- 実施日: 2026-01-04
- 環境: MODERNIZED_APP_HTTP_PORT=19085 / MODERNIZED_POSTGRES_PORT=56010 / MINIO_API_PORT=9200

## 取得ログ
- 病名 patientId 欠落: `logs/disease_missing_patientid_400_headers.txt`, `logs/disease_missing_patientid_400_body.json`
- 病名 patientId 欠落（初回 500 HTML）: `logs/disease_missing_patientid_headers.txt`, `logs/disease_missing_patientid_body.json`
- 監査イベント一覧: `logs/audit_event_recent.txt`
- サーバーログ抜粋: `logs/server_recent.log`
- 404（/orca/order/bundles）: `logs/order_bundle_missing_patientid_400_headers.txt`

## 補足
- d_audit_event / d_facility / d_users / d_roles を最小構成で投入し、ヘッダ認証と監査記録を通すための初期化を実施。
- スクリーンショットは未取得（CLI で API を直接検証したため）。証跡はログで代替。
- `logs/disease_missing_patientid_body.json` が 500 HTML となった理由は、初回実行時に `d_audit_event` が未作成でサーバーが内部エラーを返したため。テーブル投入後に 400 JSON で再取得した内容が `logs/disease_missing_patientid_400_body.json`。
- 監査イベント短評（`logs/audit_event_recent.txt` と整合）:
  - `/orca/disease` の拒否理由: `field=patientId` / `errorMessage=patientId is required`（eventType: `ORCA_DISEASE_MUTATION`）。
  - `/orca/order/bundles` は 404 となり `REST_ERROR_RESPONSE` で `http_404` を記録。
