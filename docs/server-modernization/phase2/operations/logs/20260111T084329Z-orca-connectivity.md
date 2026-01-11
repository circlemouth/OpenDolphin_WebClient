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
  - 事前状態: DB schema 未初期化で HTTP 500（`d_users` / `d_audit_event` が存在せず監査/認証処理で失敗）
  - 対応: Legacy schema dump を Modernized DB に適用 → `ops/db/local-baseline/local_synthetic_seed.sql` を投入
    - `artifacts/orca-connectivity/20260111T084329Z/db/modern_schema_apply.log`
    - `artifacts/orca-connectivity/20260111T084329Z/db/modern_seed.log`
  - 再実行（ユーザー `LOCAL.FACILITY.0001:dolphin`）:
    - `/orca/visits/list` → HTTP 404（JAX-RS で path 未解決のため応答なし）
    - `/orca/visits/mutation` → HTTP 200、ORCA へ到達し `ORCA_REQUEST/RESPONSE` ログで 200 を確認
      - レスポンス JSON の `apiResult`/`apiResultMessage` は空（XML→DTO 変換で未反映のため要調査）
    - Evidence: `artifacts/orca-connectivity/20260111T084329Z/server/`（`recheck`/`recheck2` 参照）

## 追記
- 直叩きの 3 API はすべて HTTP 200 + XML 応答を確認。
- server-modernized 経由でも acceptmodv2 への到達（ORCA 200 応答）を確認したが、
  `/orca/visits/list` の 404 と `apiResult` 反映漏れは残課題。
