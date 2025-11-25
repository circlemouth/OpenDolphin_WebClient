# Live プロファイル計測（未実施）

- RUN_ID: 20251124T180000Z（親: 20251124T000000Z）
- 状態: 未実施
- 理由: 実 API 接続先となる `VITE_DEV_PROXY_TARGET` を本作業環境で安全に設定できず、MSW 無効（VITE_DISABLE_MSW=1）でのプレビュー起動ができないため。ORCA 接続経路は機微情報のため `docs/web-client/operations/mac-dev-login.local.md` 参照が必要だが、本 RUN では提供なし。
- 次手順: 実 API エンドポイントが提供されたら `VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=<URL> npm run preview -- --host --port 4173` で再計測し、LHCI 3 回実行（median 採用）。結果は本ディレクトリ配下に保存する。
