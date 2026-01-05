# ORCA API 互換テスト結果

RUN_ID: 20260105T142945Z

## 目的
- API-only で診療フローが成立することを検証する。
- CLAIM 依存なしで API が完結することを確認する。

## 実行環境
- 接続先: WebORCA Trial (https://weborca-trial.orca.med.or.jp)
- 認証: Basic (trial / <MASKED>)
- 方式: API-only
- Modernized サーバー: http://localhost:9085/openDolphin/resources
- 証跡: artifacts/orca-connectivity/20260105T142945Z/

## 実施内容
### 正常系（API-only 診療フロー）
- POST /orca/patient/mutation
  - HTTP 200 / apiResult=00
- POST /orca/disease
  - HTTP 200 / apiResult=00
- POST /orca/order/bundles
  - HTTP 200 / apiResult=00
- POST /orca/medical/records
  - HTTP 200 / apiResult=00
- POST /orca21/medicalmodv2/outpatient
  - HTTP 200 / outcome=SUCCESS

### 異常系
- /orca/patient/mutation (operation 不正)
  - HTTP 400
- /orca/disease (diagnosisName 空)
  - HTTP 400
- /orca/order/bundles GET (entity 不正)
  - HTTP 400
- /orca/medical/records (patientId 欠落)
  - HTTP 400
- ORCA API Basic 認証エラー (Trial)
  - HTTP 401

## 結果
- API-only の診療フロー（患者作成→病名→オーダー→診療記録→外来取得）が正常系で完走。
- 主要 API の正常系/異常系が通過し、完了条件を満たした。

## 証跡
- 実行ログ: docs/server-modernization/orca-claim-deprecation/logs/20260105T142945Z-orca-api-compat.md
- 証跡ディレクトリ: artifacts/orca-connectivity/20260105T142945Z/

## 参考
- 20260105T132625Z の Trial 直接 API 測定は本 RUN の API-only 完走で更新済み。
