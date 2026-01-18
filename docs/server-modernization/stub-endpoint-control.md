# Stub エンドポイント公開制御

RUN_ID: 20260118T010427Z

## 対象
- `/orca/medical-sets`
- `/orca/tensu/sync`
- `/orca/birth-delivery`
- `/orca/patient/mutation`（delete を含む）
- `/orca12/patientmodv2/outpatient` および `/mock`

## 制御方法
- フィルタ: `StubEndpointExposureFilter` が `/orca/*` でリクエストを検査し、該当パスを遮断。
- デフォルト動作:
  - 環境名が `prod` / `prd` / `production` / `stage` / `stg` / `staging` / `it` / `uat` で始まる場合は遮断。
  - それ以外は許可（従来挙動維持）。
- 環境変数/プロパティで明示的に設定:
  - `OPENDOLPHIN_STUB_ENDPOINTS_MODE=block|allow`（`opendolphin.stub.endpoints.mode`）
  - `OPENDOLPHIN_STUB_ENDPOINTS_ALLOW=true|false`（`opendolphin.stub.endpoints.allow`）
  - 環境名上書き: `OPENDOLPHIN_ENVIRONMENT`（`opendolphin.environment`）

## 本番/IT 推奨設定例
```bash
OPENDOLPHIN_ENVIRONMENT=production
OPENDOLPHIN_STUB_ENDPOINTS_MODE=block   # 明示
```

## 実機確認 (2026-01-18, RUN_ID=20260118T010427Z)
- 環境変数: `OPENDOLPHIN_ENVIRONMENT=production`, `OPENDOLPHIN_STUB_ENDPOINTS_MODE=block`
- 証跡: `artifacts/orca-connectivity/20260118T010427Z/stub-block/`
  - `/orca/medical-sets` 404 stub_endpoint_disabled
  - `/orca/tensu/sync` 404 stub_endpoint_disabled
  - `/orca/birth-delivery` 404 stub_endpoint_disabled
  - `/orca/patient/mutation` 404 stub_endpoint_disabled
  - `/resources/orca12/patientmodv2/outpatient/mock` 404 stub_endpoint_disabled
  - `/resources/dolphin` 200 (他 API 正常)

## 検証手順（例）
```bash
# server-modernized を起動後
curl -i http://localhost:19082/openDolphin/orca/medical-sets
curl -i http://localhost:19082/openDolphin/orca/tensu/sync
curl -i http://localhost:19082/openDolphin/orca/birth-delivery
curl -i http://localhost:19082/openDolphin/orca/patient/mutation -d '{}' -H 'Content-Type: application/json'
curl -i http://localhost:19082/openDolphin/orca12/patientmodv2/outpatient/mock -d '{}' -H 'Content-Type: application/json'
# いずれも 404 stub_endpoint_disabled となることを確認
```

## テスト
- `mvn -pl server-modernized -Dtest=StubEndpointExposureFilterTest test`
  - stub パス検知、prod 環境でのデフォルト遮断、明示許可の各分岐をカバー。
