RUN_ID: 20260118T010427Z
Status: done (production block via filter)

## 目的
本番/IT 環境で ORCA 周辺の stub・未検証エンドポイント（medical-sets / tensu/sync / birth-delivery / patient mutation mock 等）が露出しないよう強制遮断する。

## 対象エンドポイント
- `/orca/medical-sets`
- `/orca/tensu/sync`
- `/orca/birth-delivery`
- `/orca/patient/mutation`
- `/orca12/patientmodv2/outpatient`（mock系含む）

## 実装
- 新フィルタ `StubEndpointExposureFilter` を追加し、`/orca/*` へのリクエストで上記パスを検知した場合に 404 + `stub_endpoint_disabled` を返却。
- 制御キー
  - `OPENDOLPHIN_ENVIRONMENT` / `opendolphin.environment`：prod/prd/production/stage/it/uat 系で始まる場合はデフォルト遮断。
  - `OPENDOLPHIN_STUB_ENDPOINTS_MODE` / `opendolphin.stub.endpoints.mode`：`allow|on` で許可、`block|deny|off` で遮断。
  - `OPENDOLPHIN_STUB_ENDPOINTS_ALLOW` / `opendolphin.stub.endpoints.allow`：true/false を直接指定。
- フィルタは `LogFilter` と同じ `/orca/*` に適用（`web.xml`）。

## デフォルト動作
- 環境が prod/prd/production/stage/it/uat で始まる場合は遮断。
- それ以外は許可（従来挙動を維持）だが、本番デプロイでは上記環境変数で遮断運用する。

## テスト
- `mvn -pl server-modernized -Dtest=StubEndpointExposureFilterTest test`
  - stub パス検知、prod 環境でのデフォルト遮断、明示許可の各分岐を確認。
  - 実行日時: 2026-01-18T13:02 JST
- 実機確認 (OPENDOLPHIN_ENVIRONMENT=production / OPENDOLPHIN_STUB_ENDPOINTS_MODE=block)
  - 証跡: `artifacts/orca-connectivity/20260118T010427Z/stub-block/`
  - `/orca/medical-sets` / `/orca/tensu/sync` / `/orca/birth-delivery` / `/orca/patient/mutation` → 404 stub_endpoint_disabled
  - `/resources/orca12/patientmodv2/outpatient/mock` → 404 stub_endpoint_disabled
  - `/resources/dolphin` → 200 (他機能に影響なし)

## 運用メモ
- 本番/IT デプロイ時は `OPENDOLPHIN_ENVIRONMENT=production` 等を設定することで自動遮断される。
- 一時的に検証が必要な場合のみ `OPENDOLPHIN_STUB_ENDPOINTS_MODE=allow` または `OPENDOLPHIN_STUB_ENDPOINTS_ALLOW=true` を投入して開放する（開放時は監査ログ側で `stubExposure=blocked` が false となる点に留意）。
- 設定・検証手順の詳細は `docs/server-modernization/stub-endpoint-control.md` を参照。
