# 05 Legacy REST 互換 API（Webクライアント接続）

## 前提ドキュメント
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-unused-features.md`（D）
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/ux/ux-documentation-plan.md`

## 対象リソース
- `/pvt` `/pvt2` `/appo`
- `/karte` `/stamp` `/patient` `/odletter`
- `/schedule` `/reporting/karte` `/lab` `/mml`
- `/chartEvent` `/chart-events` `/system` `/serverinfo` `/demo`

## 実装範囲
- Webクライアントの API モジュール追加（httpClient 経由）。
- 画面導線と権限ガードの整理。
- 監査ログに legacy 判別タグを付与。

## 受け入れ条件
- 対象画面から 2xx/4xx を判別できる。
- 監査ログに legacy 判別タグが残る。
