# Web クライアント前提 API 実装切替
- 期間: 2026-01-05 11:00 - 2026-01-08 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/06_server_ops_required/WebClient前提API_実装切替.md`

## 目的
- Web クライアント前提の ORCA/Claim 系 API を実実装へ切替する。

## 参照
- `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_master_API_実接続.md`
- `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_監査補完.md`
- `docs/DEVELOPMENT_STATUS.md`

## 留意点
- Claim 側が直近 24h のドキュメント参照に限定されるため、要件上の対象期間不足の可能性がある。
- Medical の処置バンドル対象エンティティの網羅性は実測で確認する。
- 本番相当データ量での性能評価・起動/E2E 検証は証跡統合タスクへ移管済み。

## API 疎通確認（ローカル）
> RUN_ID は `YYYYMMDDThhmmssZ` で採番し、同じ値を両リクエストに使う。

1. 環境起動（Docker + Web クライアント）
   - `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
2. Web クライアント側で MSW を無効化し、modernized へ直結
   - `export VITE_DISABLE_MSW=1`
   - `export VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources`
3. API 疎通確認（curl で 200 を確認）
   - 認証は **`dolphindev` の MD5** を使用する（`1cc2f4c06fd32d0a6e2fa33f6e1c9164`）。
   - `/orca/claim/outpatient`:
     - `curl -s -D - \`
       `-H "userName: 1.3.6.1.4.1.9414.10.1:dolphindev" \`
       `-H "password: 1cc2f4c06fd32d0a6e2fa33f6e1c9164" \`
       `-H "clientUUID: devclient" \`
       `-H "X-Facility-Id: 1.3.6.1.4.1.9414.10.1" \`
       `-H "Content-Type: application/json" \`
       `-H "X-Run-Id: <RUN_ID>" \`
       `-d '{}' \`
       `http://localhost:9080/openDolphin/resources/orca/claim/outpatient`
   - `/orca21/medicalmodv2/outpatient`:
     - `curl -s -D - \`
       `-H "userName: 1.3.6.1.4.1.9414.10.1:dolphindev" \`
       `-H "password: 1cc2f4c06fd32d0a6e2fa33f6e1c9164" \`
       `-H "clientUUID: devclient" \`
       `-H "X-Facility-Id: 1.3.6.1.4.1.9414.10.1" \`
       `-H "Content-Type: application/json" \`
       `-H "X-Run-Id: <RUN_ID>" \`
       `-d '{}' \`
       `http://localhost:9080/openDolphin/resources/orca21/medicalmodv2/outpatient`
4. 期待結果
   - HTTP 200
   - `runId=<RUN_ID>`
   - `dataSourceTransition=server`
   - `auditEvent.action` が claim=`ORCA_CLAIM_OUTPATIENT` / medical=`ORCA_MEDICAL_GET`
   - `auditEvent.details` に `recordsReturned` / `outcome` を含む

## 完了条件
- 実装切替が完了していること（mock 応答の撤去/実実装の応答が可能な状態）。
- 疎通/性能/監査の証跡取得は証跡統合タスクで実施すること。
