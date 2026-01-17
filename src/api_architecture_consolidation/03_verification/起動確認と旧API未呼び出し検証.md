# 起動確認と旧API未呼び出し検証

- RUN_ID: 20260117T213737Z
- 実施日: 2026-01-17
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1768685738428-df9420
- 起動方法: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- Webクライアント: http://localhost:5173
- Modernized Server: http://localhost:9080/openDolphin

## 1. 起動確認（主要導線 2xx）

### Webクライアント ルート
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
- `artifacts/api-architecture-consolidation/20260117T213737Z/*.json`
- `artifacts/api-architecture-consolidation/20260117T213737Z/*.headers.txt`

## 2. 監査ログ（runId/traceId/requestId）確認

- `patients-local-search` と `claim-outpatient` のレスポンスで `runId/traceId/requestId` を確認。
- `Audit envelope drained` ログで `traceId` を含む監査イベント出力を確認。

証跡:
- `artifacts/api-architecture-consolidation/20260117T213737Z/audit-log-snippet.txt`

## 3. 旧API未呼び出し確認

- サーバーログに対し以下の旧APIパスを検索し、該当なしを確認。
  - `/api01rv2/appointment`
  - `/api01rv2/claim`
  - `/api01rv2/patient/outpatient`

証跡:
- `artifacts/api-architecture-consolidation/20260117T213737Z/legacy-api-check.txt`

※ ORCA公式パススルー（例: `/api01rv2/visitptlstv2`, `/api01rv2/appointlstv2`）のログは確認されるが、移行計画上の旧APIには該当しない。

## 4. 結論

- 主要導線の 2xx を確認。
- `runId/traceId/requestId` を含む監査ログの出力を確認。
- 旧APIパスの呼び出しは検出されず。

以上より、完了条件を満たすことを確認済み。
