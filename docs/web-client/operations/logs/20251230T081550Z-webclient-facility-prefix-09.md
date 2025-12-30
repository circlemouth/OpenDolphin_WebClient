# WebClient 施設ID補完フロー動作確認ログ（RUN_ID=20251230T081550Z）

## 対象タスク
- YAML ID: `src/webclient_facility_prefix/09_追加変更の動作確認.md`
- 期間: 2025-12-31 07:30 - 2026-01-01 07:30
- 優先度: medium / 緊急度: high

## 前提ドキュメント
- `docs/DEVELOPMENT_STATUS.md`
- `web-client/README.md`
- `setup-modernized-env.sh`
- `docs/web-client/`

## 実行環境
- 作業ディレクトリ: `/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1767082435832-dec274`
- WEB_CLIENT_MODE: npm
- 起動コマンド（ポート競合回避のため上書き）:
  ```bash
  WEB_CLIENT_MODE=npm \
  MODERNIZED_APP_HTTP_PORT=19080 \
  MODERNIZED_APP_ADMIN_PORT=19995 \
  MODERNIZED_POSTGRES_PORT=55434 \
  MINIO_API_PORT=19000 \
  MINIO_CONSOLE_PORT=19001 \
  FIDO2_ALLOWED_ORIGINS="https://localhost:8443,http://localhost:19080" \
  VITE_DEFAULT_FACILITY_ID="1.3.6.1.4.1.9414.10.1" \
  ./setup-modernized-env.sh
  ```

## 作業内容
1. `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動確認。
   - 既存コンテナとのポート競合のため上記ポートを一時変更。
2. `/login` 直アクセス時に施設ID補完が効くよう `VITE_DEFAULT_FACILITY_ID` を付与。
3. モダナイズ DB が空で `d_facility` / `d_users` が無かったため、既存 `opendolphin-postgres-modernized` から schema-only を取得して投入。
4. `search_path` が `opendolphin` のみだと `d_audit_event_id_seq` が参照できず 500 になるため、`ALTER ROLE opendolphin SET search_path TO public,opendolphin;` を実行。
5. `public.d_users` の `userid` を `1.3.6.1.4.1.9414.10.1:dolphindev` に更新し、ログイン可能に調整。

## 動作確認結果
- `/login` 直アクセス → `/f/1.3.6.1.4.1.9414.10.1/login` へ自動遷移（施設ID補完）を確認。
- UUID 入力なしで `dolphindev / dolphindev` でログイン可能。
- ログイン後 `/f/1.3.6.1.4.1.9414.10.1/reception` へ遷移することを確認。

## 備考
- 本検証は DB 初期化が必要だったため、schema-only の投入・search_path 調整・userid 更新を実施。
- これらは検証環境限定の操作であり、リポジトリへのコード変更はなし。

