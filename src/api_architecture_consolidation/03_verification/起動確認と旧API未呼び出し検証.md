# 起動確認と旧API未呼び出し検証

- RUN_ID: 20260117T220347Z
- 実施日: 2026-01-17
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1768685738428-df9420
- 起動方法: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- Webクライアント: http://localhost:5173
- Modernized Server: http://localhost:9080/openDolphin

## 1. 起動確認（主要導線 2xx）

### Webクライアント ルート（HEAD）
- `/` → 200
- `/reception` → 200
- `/patients` → 200
- `/charts` → 200
- `/administration` → 200

### API疎通（主要導線）
- Administration: `GET /openDolphin/resources/api/admin/config` → 200
- Patients: `POST /openDolphin/resources/orca/patients/local-search` → 200
- Charts: `POST /openDolphin/resources/orca/claim/outpatient/information` → 200
- Reception: `POST /openDolphin/resources/orca/visits/list` → 200
- Reception: `POST /openDolphin/resources/orca/appointments/list` → 200

API応答とヘッダの記録は以下に保存済み:
- `artifacts/api-architecture-consolidation/20260117T220347Z/*.json`
- `artifacts/api-architecture-consolidation/20260117T220347Z/*.headers.txt`

Webクライアント主要ルートのHEADレスポンス:
- `artifacts/api-architecture-consolidation/20260117T220347Z/ui-root.headers.txt`
- `artifacts/api-architecture-consolidation/20260117T220347Z/ui-reception.headers.txt`
- `artifacts/api-architecture-consolidation/20260117T220347Z/ui-patients.headers.txt`
- `artifacts/api-architecture-consolidation/20260117T220347Z/ui-charts.headers.txt`
- `artifacts/api-architecture-consolidation/20260117T220347Z/ui-administration.headers.txt`

実行コマンドと時刻は `artifacts/api-architecture-consolidation/20260117T220347Z/command-log.txt` に記録。

## 2. RUN_ID不整合の解消

- appointments/visits のレスポンス JSON 内 `runId` が `20260117T220347Z` と一致することを確認。
- 再取得コマンドと実行時刻は `artifacts/api-architecture-consolidation/20260117T220347Z/command-log.txt` に記録。

証跡:
- `artifacts/api-architecture-consolidation/20260117T220347Z/appointments-list.json`
- `artifacts/api-architecture-consolidation/20260117T220347Z/visits-list.json`

## 3. 監査ログ（runId/traceId/requestId）確認とFAILURE説明

- `patients-local-search` と `claim-outpatient` のレスポンスで `runId/traceId/requestId` を確認。
- `Audit envelope drained` ログで `traceId` を含む監査イベント出力を確認。

REST_UNAUTHORIZED_GUARD の理由:
- 初回検証で `userName/password` に管理者用の facilityId 形式ヘッダを使い、`d_users` に存在しないため 401。
- 追加で `curl -u` の Basic 認証のみでもヘッダ認証が満たせず 401。
- 再検証では `dolphindev` + MD5 パスワードをヘッダ認証として送信し、成功ログを取得。

証跡:
- `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.txt`
- 元ログ: `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.raw.txt`

## 4. 旧API未呼び出し確認

- サーバーログに対し以下の旧APIパスを検索し、該当なしを確認。
  - ログ対象: `docker logs --since 5m opendolphin-server-modernized-dev-task-1768685738428-df9420`
  - 検索パターン: `api01rv2/(appointment|claim|patient/outpatient)`

証跡:
- `artifacts/api-architecture-consolidation/20260117T220347Z/legacy-api-check.txt`

※ ORCA公式パススルー（例: `/api01rv2/visitptlstv2`, `/api01rv2/appointlstv2`）のログは確認されるが、移行計画上の旧APIには該当しない。

## 5. ANSIエスケープ除去

- 元ログ: `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.raw.txt`
- クリーン版: `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.txt`

## 6. 結論

- 主要導線の 2xx を確認。
- appointments/visits の `runId` が当日RUN_IDと一致することを確認。
- `runId/traceId/requestId` を含む監査ログの出力を確認。
- 旧APIパスの呼び出しは検出されず。

以上より、完了条件を満たすことを確認済み。
