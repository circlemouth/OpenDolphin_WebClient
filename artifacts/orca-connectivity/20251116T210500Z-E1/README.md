# RUN_ID=20251116T210500Z-E1 / EXT-01 PHR REST Evidence

- 指示: 【ワーカー指示】PHR REST 実装 + 証跡取得 (RUN_ID=20251116T210500Z-E1)。
- 対象: EXT-01 で列挙された `phr_access_key` Flyway 適用・Layer ID / Export Secrets・監査 ID・RESTEasy リソース登録の確認、および Trial / ORMaster (Modernized 経路) の CRUD 証跡採取。
- 運用制約: Docker 起動禁止・VPN/ORMaster 接続不可のため、既存 RUN (`20251121TrialPHRSeqZ1-*`) の HTTP/監査ログを再整理し、本 RUN の artifacts 配下へ集約した。Trial 側は 404/405 証跡を保持しつつ Blocker 根拠を追記、ORMaster 側は Modernized サーバー (`server-modernized-dev`、BASIC 認証) を用いた 200 系応答＋監査ログを暫定 Evidence とし、ORMaster 実機での再検証を次アクションとして記録。
- 参照ドキュメント: `docs/server-modernization/phase2/notes/external-api-gap-20251116T111329Z.md` §2.1, `docs/server-modernization/phase2/operations/logs/20251116T210500Z-E1-phr.md`, `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行。

## フォルダガイド
- `trial/logs/curl_summary.log`: RUN_ID=`20251121TrialPHRSeqZ1-A/B` の 404/405 CRUD 結果（`curl -u trial:weborcatrial`）をコピー。Trial サーバー未開放のため Spec-based の根拠として引用。
- `ormaster/crud/*`: RUN_ID=`20251121TrialPHRSeqZ1-CTX` で Modernized サーバー経由（BASIC 認証）に取得した 200 系 JSON/Headers。ORMaster ではなく WildFly 実装の挙動確認だが、RESTEasy リソース登録＋監査 ID (`PHR_ACCESS_KEY_*`, `PHR_*_TEXT`) が動作していることを示す。
- `ormaster/logs/claim_conn.json`: `ServerInfoResource` の hash 付きレスポンス。`ormaster/wildfly/phr_*.log` と併せてモダナイズ側の AUDIT/JPA ログを確認。
- `checks/flyway.md`: `server-modernized/tools/flyway/sql/V0228__phr_key_and_async_job.sql` のハイライト。`phr_access_key` テーブルと `phr_async_job` 定義を RUN_ID と紐づけ。
- `checks/secrets.md`: `.env.modernized` と `ops/check-secrets.sh` の整合性メモ。`PHR_EXPORT_SIGNING_SECRET` / Layer ID Secrets 現状と不足項目を列挙。

> 今後: ORMaster 実測が解禁された時点で `trial/logs/` を 200/403 応答へ差し替え、本 README と DOC_STATUS 備考を更新する。
