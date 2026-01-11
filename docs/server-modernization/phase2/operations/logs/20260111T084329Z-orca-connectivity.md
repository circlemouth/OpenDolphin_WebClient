# ORCA Trial Connectivity Log (RUN_ID=20260111T084329Z)

## 概要
- 目的: server-modernized の ORCA API 修正後に WebORCA Trial で XML 応答を再確認する。
- 実行日: 2026-01-11 (UTC) / 2026-01-11 (JST)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic `<MASKED>` / `<MASKED>`
- 証跡: `artifacts/orca-connectivity/20260111T084329Z/`

## 実行コマンド（抜粋）
- `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- `curl -u <MASKED>:<MASKED> -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' -X POST --data-binary @trial/system01dailyv2/request.xml https://weborca-trial.orca.med.or.jp/api/api01rv2/system01dailyv2`
- `curl -u <MASKED>:<MASKED> -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' -X POST --data-binary @trial/visitptlstv2/request.xml https://weborca-trial.orca.med.or.jp/api/api01rv2/visitptlstv2`
- `curl -u <MASKED>:<MASKED> -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' -X POST --data-binary @trial/acceptmodv2/request.xml https://weborca-trial.orca.med.or.jp/api/orca11/acceptmodv2`

## 結果（Trial 直叩き）
| API | HTTP | Api_Result | Api_Result_Message | Evidence |
| --- | --- | --- | --- | --- |
| system01dailyv2 | 200 | 00 | 処理終了 | `artifacts/orca-connectivity/20260111T084329Z/trial/system01dailyv2/` |
| visitptlstv2 | 200 | 13 | 対象がありません | `artifacts/orca-connectivity/20260111T084329Z/trial/visitptlstv2/` |
| acceptmodv2 (Request_Number=00) | 200 | 10 | 患者番号に該当する患者が存在しません | `artifacts/orca-connectivity/20260111T084329Z/trial/acceptmodv2/` |

## server-modernized 経由の確認
- `/openDolphin/resources/orca/visits/list` と `/openDolphin/resources/orca/visits/mutation` を実行。
- 結果: HTTP 500 (DB schema 未初期化により `d_users` / `d_audit_event` が存在せず、監査/認証処理で失敗)。
- Evidence: `artifacts/orca-connectivity/20260111T084329Z/server/`

## 追記
- 直叩きの 3 API はすべて HTTP 200 + XML 応答を確認。
- server-modernized 経由の ORCA 呼び出しは DB 初期化が必要なため今回は未確認。
