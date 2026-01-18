# ORCA Transport 設定リロード運用手順

- 最終更新: 2026-01-18
- 対象: server-modernized, RestOrcaTransport キャッシュ

## API エンドポイント

- パス: `/api/admin/orca/transport/reload`
- メソッド: `POST`
- 認可: system_admin（サーバー管理者権限必須）
- 監査: 成功/失敗とも監査ログに action=`ORCA_TRANSPORT_RELOAD` と auditSummary を記録

### リクエスト例

```bash
curl -X POST \
  -u system_admin:****** \
  -H "Content-Type: application/json" \
  http://localhost:19082/openDolphin/api/admin/orca/transport/reload
```

### 成功レスポンス例

```json
{
  "runId": "20260118T052358Z",
  "auditSummary": "orca.baseUrl=https://weborca-trial.orca.med.or.jp orca.mode=weborca",
  "reloaded": true
}
```

- ヘッダ: `x-run-id` にリクエスト起算の runId、`x-orca-transport` に auditSummary を返却。

### 失敗時

- 400/502 などで JSON エラーを返却。監査ログに errorCode=`orca.transport.reload.error` を記録。

## 設定キャッシュ可視化

- アプリ起動時に INFO ログ: `ORCA transport settings loaded: ...`
- リロード成功時に INFO ログ、失敗時に WARN ログを出力。
- 設定が null / 未準備の場合、リクエスト時に WARN ログを残しつつ自動リロードを試行。

## レンジ上限（参考）

- 予約一覧/受付一覧の取得レンジは最大 31 日。
- 超過時エラー: `"... range too wide; up to 31 days are allowed"`（HTTP 400）。

## 負荷テスト

- 本タスクでは未実施。別タスクで実施予定（手順枠のみ）。
