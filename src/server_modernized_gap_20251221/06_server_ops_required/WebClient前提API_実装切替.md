# Web クライアント前提 API 実装切替
- 期間: 2026-01-05 11:00 - 2026-01-08 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/06_server_ops_required/WebClient前提API_実装切替.md`

## 目的
- Web クライアント前提の ORCA/Claim 系 API を実実装へ切替する。

## 参照
- `src/server_modernized_gap_20251221/06_server_ops_required/ORCA_master_API_実接続.md`
- `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_監査補完.md`
- `docs/DEVELOPMENT_STATUS.md`

## 留意点（未解決/要検証）
- Claim 側が直近 24h のドキュメント参照に限定されるため、要件上の対象期間不足の可能性がある。
- Medical の処置バンドル対象エンティティの網羅性が未確認。
- 本番相当データ量での性能評価・起動/E2E 検証が未実施。
