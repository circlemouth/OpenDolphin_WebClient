# Handover: WebORCA Trial 公式API対応 (RUN_ID=20260112T060857Z)

## 目的
- WebORCA Trial の公式API仕様に合わせて `/api` 統一・xml2 送信・URL 生成ロジックを修正し、必須エンドポイントの HTTP 200 + Api_Result 正常を再現する。

## 変更点（実装済み）
- `system01lstv2` のデフォルト xml2 を `system01lstv2req` に統一（旧 `system01_lstreq` 廃止）。
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java`
- ORCA_MODE=weborca 時の `/api` 二重付与を防止。
  - `server-modernized/src/main/java/open/dolphin/orca/transport/RestOrcaTransport.java`
- `acceptlstv2` / `manageusersv2` / `prescriptionv2` の xml2 送信を厳密化（JSON/空payload拒否）。
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaAcceptanceListResource.java`
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaSystemManagementResource.java`
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java`
- blobapi 取得の URL 再試行と、`X-Orca-Blob-Url` ヘッダの付与。
  - `server-modernized/src/main/java/open/dolphin/rest/OrcaReportResource.java`

## 起動・環境
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- ORCA Trial Basic: `trial/weborcatrial`
- ORCA_BASE_URL: `https://weborca-trial.orca.med.or.jp`
- ORCA_MODE: `weborca`
- Vite dev proxy は `/api` を経由（`web-client/vite.config.ts`）。

## 認証（server-modernized へのアクセス）
- `userName=dolphindev`
- `password=md5(dolphindev)=1cc2f4c06fd32d0a6e2fa33f6e1c9164`
- `X-Facility-Id=1.3.6.1.4.1.9414.10.1`

## 検証結果（必須エンドポイント）
- `POST /api/api01rv2/system01lstv2?class=02`
  - HTTP 200 / Api_Result=00 / physician list OK
- `POST /api/orca101/manageusersv2`
  - HTTP 200 / Api_Result=0000
- `POST /api/api01rv2/acceptlstv2?class=01`
  - HTTP 200 / Api_Result=21（受付なし）

## 帳票（prescriptionv2）現状
- `POST /api/api01rv2/prescriptionv2` は Api_Result=0001（帳票データなし）。
- Trial 側に処方印刷可能なデータが存在せず `Data_Id` を取得できないため、blobapi 取得まで未達。
- Trial 側調査として `visitptlstv2` / `medicalgetv2` / `api21/medicalmodv2` を試行し Api_Result=00 を確認したが、処方データ生成に至らず。

## 再試験のヒント
- Trial 側で処方データが存在する患者/伝票が必要。
- まず `visitptlstv2` (Request_Number=02) で月次の来院データがある月を探す。
  - 例: 2024-04 に来院あり。
- `visitptlstv2` (Request_Number=01) で日次の `Voucher_Number` を取得。
- `prescriptionv2` は公式サンプル通り、`Patient_ID` + `Invoice_Number`（伝票番号）+ `Outside_Class` を送る。
- 成功時レスポンスに `Data_Id` が含まれる想定。取得後に `/blobapi/<Data_Id>` を GET。

## 証跡
- 実測ログ: `docs/server-modernization/phase2/operations/logs/20260112T060857Z-orca-trial-official-api.md`
- リクエスト/レスポンス: `artifacts/orca-connectivity/20260112T060857Z/`

## コミット
- `cc06b29e7` (Align ORCA xml2 payloads and URL handling)
