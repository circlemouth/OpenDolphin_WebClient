# RUN_ID=20260112T060857Z WebORCA Trial 公式API検証

## 目的
- WebORCA Trial 公式API仕様に合わせた `/api` 統一・xml2送信・URL生成修正の動作検証
- `system01lstv2` / `manageusersv2` / `acceptlstv2` / `prescriptionv2` の疎通と応答確認
- blobapi 取得ロジックの試行

## 起動
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- コンテナ名: `opendolphin-server-modernized-dev-task-1768178793844-555226`

## 認証
- OpenDolphin REST: `userName=dolphindev` / `password=md5(dolphindev)=1cc2f4c06fd32d0a6e2fa33f6e1c9164` + `X-Facility-Id=1.3.6.1.4.1.9414.10.1`
- ORCA Trial (直叩き調査): Basic `trial/weborcatrial`

## 実測結果 (server-modernized 経由)
- `POST /api/api01rv2/system01lstv2?class=02`
  - HTTP 200 / Api_Result=00 / physician list OK
  - req: `artifacts/orca-connectivity/20260112T060857Z/request/system01lstv2.xml`
  - res: `artifacts/orca-connectivity/20260112T060857Z/response/system01lstv2.xml`
- `POST /api/orca101/manageusersv2`
  - HTTP 200 / Api_Result=0000
  - req: `artifacts/orca-connectivity/20260112T060857Z/request/manageusersv2.xml`
  - res: `artifacts/orca-connectivity/20260112T060857Z/response/manageusersv2.xml`
- `POST /api/api01rv2/acceptlstv2?class=01`
  - HTTP 200 / Api_Result=21（受付なし）
  - req: `artifacts/orca-connectivity/20260112T060857Z/request/acceptlstv2.xml`
  - res: `artifacts/orca-connectivity/20260112T060857Z/response/acceptlstv2.xml`

## Vite dev proxy
- `web-client/vite.config.ts` は `/api` を Trial へ転送する設定を維持（`/api` 経由が正）。

## 帳票 (prescriptionv2) 検証
- ORCA Trial の来院情報を `visitptlstv2` で調査し、患者 `00002` / 伝票 `0002375` を取得
- 公式サンプルに沿って `prescriptionv2` を実行したが、現行 Trial では `Api_Result=0001` が返り、帳票データ無し
  - req: `artifacts/orca-connectivity/20260112T060857Z/request/prescriptionv2.xml`
  - res: `artifacts/orca-connectivity/20260112T060857Z/response/prescriptionv2.json`
- Trial 側に帳票出力可能な処方データが存在しないため、`Data_Id` を得られず blobapi 取得は未実施

## Trial 側の追加調査 (直叩き)
- `visitptlstv2` / `medicalgetv2` で訪問・請求データを調査
  - `visitptlstv2` (2024-04/2025-02/2025-04) に来院情報あり
  - `medicalgetv2` で処方情報を示す要素が無く、処方印刷用データが不足
- `api21/medicalmodv2` で診療行為登録を試行し Api_Result=00 を確認
  - res: `artifacts/orca-connectivity/20260112T060857Z/response/medicalmodv2_orca.json`
  - ただし点数マスタ未登録警告が残り、処方印刷データ生成には至らず

## 証跡
- `artifacts/orca-connectivity/20260112T060857Z/`
