# ORCA Trial Karte 自動生成 実測ログ

- RUN_ID: 20260111T221350Z
- 実施日: 2026-01-11
- Trial 制約: 実在情報は入力しない / CLAIM 通信不可 / 印刷不可

## 実施内容
- /orca/patient/mutation の患者作成時に Karte を自動生成する処理を追加。
- 既存患者で Karte がない場合にも生成できるようガード条件を調整。
- d_karte_seq が存在せず患者登録が失敗したため、DB へシーケンスを追加し、起動スクリプトにも追記。

## 起動
- `MODERNIZED_APP_HTTP_PORT=19082 MODERNIZED_APP_ADMIN_PORT=19996 MODERNIZED_POSTGRES_PORT=55436 MINIO_API_PORT=19002 MINIO_CONSOLE_PORT=19003 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`

## 実測結果
- MOCK 患者ID: `MOCK-20260111-221350-D`

| API | 期待 | 結果 | ステータス | 証跡 |
| --- | --- | --- | --- | --- |
| POST /orca/patient/mutation | 患者作成 + Karte 自動生成 | 正常レスポンス | 200 | `artifacts/orca-connectivity/20260111T221350Z/request-patient-mutation.json` / `artifacts/orca-connectivity/20260111T221350Z/response-patient-mutation.json` / `artifacts/orca-connectivity/20260111T221350Z/headers-patient-mutation.txt` / `artifacts/orca-connectivity/20260111T221350Z/status-patient-mutation.txt` |
| POST /orca/disease | 病名作成 | 正常レスポンス | 200 | `artifacts/orca-connectivity/20260111T221350Z/request-orca-disease.json` / `artifacts/orca-connectivity/20260111T221350Z/response-orca-disease.json` / `artifacts/orca-connectivity/20260111T221350Z/headers-orca-disease.txt` / `artifacts/orca-connectivity/20260111T221350Z/status-orca-disease.txt` |
| POST /orca/disease/v3 | 病名作成 | 正常レスポンス | 200 | `artifacts/orca-connectivity/20260111T221350Z/request-orca-disease.json` / `artifacts/orca-connectivity/20260111T221350Z/response-orca-disease-v3.json` / `artifacts/orca-connectivity/20260111T221350Z/headers-orca-disease-v3.txt` / `artifacts/orca-connectivity/20260111T221350Z/status-orca-disease-v3.txt` |
| POST /orca/medical/records | 診療履歴取得 | 正常レスポンス | 200 | `artifacts/orca-connectivity/20260111T221350Z/request-orca-medical-records.json` / `artifacts/orca-connectivity/20260111T221350Z/response-orca-medical-records.json` / `artifacts/orca-connectivity/20260111T221350Z/headers-orca-medical-records.txt` / `artifacts/orca-connectivity/20260111T221350Z/status-orca-medical-records.txt` |

## 失敗/制約メモ
- Trial 制約のため CLAIM/印刷は実測対象外。
- d_karte_seq 不在により /orca/patient/mutation が 500 になったため、DB シーケンスを追加して再測。

## 参考ログ
- `docs/server-modernization/phase2/operations/logs/20260111T215124Z-orca-trial-500-analysis.md`
