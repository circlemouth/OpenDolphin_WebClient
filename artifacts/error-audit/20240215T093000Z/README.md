# artifacts/error-audit/20240215T093000Z

- RUN_ID=`20240215T093000Z`（親 RUN=`20251120T193040Z`）。ログ採取テンプレは `docs/server-modernization/phase2/operations/logs/20240215T093000Z-error-audit.md` を参照。
- 収集物は `wildfly/`（server.log）、`trace/`（trace_http_* / d_audit_event）、`metrics/`、`httpdump/`、`thread-dump/`、`heap-dump/`、`client-requests/`、`docs/` へ保存し、ファイル名に取得時刻を含める。
- 機微情報は伏字または削除してから配置し、DOC_STATUS/05 章へ同一パスを記載する。
