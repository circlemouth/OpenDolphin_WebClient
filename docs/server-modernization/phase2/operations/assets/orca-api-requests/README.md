# ORCA API リクエストテンプレート集

`docs/server-modernization/phase2/operations/assets/orca-api-requests/` には WebORCA へ送信するサンプルを整理している。**標準は XML/UTF-8** とし、Shift_JIS/JSON で暫定作成していたテンプレは **Legacy（参照のみ）** として扱う。

## ディレクトリ構成
- `*.json`: 既存の Shift_JIS/JSON モック。差分調査用に残置し、運用送信には使用しない。
- `*.response.sample.json`: 旧 WebORCA ローカル環境で取得したレスポンス例（Legacy）。
- `manageusers_*.xml` / `14_patientmodv2_request.xml`: 既存の XML テンプレ。
- `xml/*.xml`: XML/UTF-8 ペイロード（`orca-meta` コメントで `path/method/content-type` を明記）。`44_system01dailyv2_request.xml` もここに配置済み。

## 使い方
1. `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §3.4 のテンプレ取得手順で `curl` 実行環境を準備する。
2. `export RUN_ID=...; mkdir -p artifacts/orca-connectivity/$RUN_ID/inpatient` など保存先を確保する。
3. `curl -u "trial:weborcatrial" -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/19_hsconfbasev2_request.xml 'https://weborca-trial.orca.med.or.jp/api/api01rv2/hsconfbasev2'` のように送信し、`artifacts/orca-connectivity/${RUN_ID}/inpatient/19_hsconfbasev2_{request,response}.xml` へ証跡を保存する。
4. 送信値に必要な seed（病棟・Perform_Month・保険者など）は `docs/server-modernization/phase2/notes/orca-api-field-validation.md` §3（Matrix No.19-38）を参照し、`docs/server-modernization/phase2/operations/assets/seeds/` 配下の SQL 断片または ORCA UI で投入する。

> **補足:** `/orcaXX/` 系の POST API（No.29-34, 36-38）は Trial 環境で `Allow: OPTIONS, GET` を返す既知の制限がある。XML テンプレは seed 突合と 405 証跡取得のために維持し、実行時は `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` の採取手順に従う。
