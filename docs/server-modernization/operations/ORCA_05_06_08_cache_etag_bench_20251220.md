# ORCA-05/06/08 キャッシュ・ETag・ベンチ準備メモ（2025-12-20）

## 目的
- ORCA-05/06/08 の ETag/TTL 実装確認とベンチ実施準備。
- ベンチ未実施の理由と次アクションを明文化。

## 実装状況（確認のみ）
- サーバー実装は既に存在（ETag/Cache-Control/Vary、TTL、監査ログ `cacheHit`/`snapshotVersion`）。
- 変更は行っていない。

## ベンチ準備の成果物
- 実行ディレクトリ: `artifacts/api-stability/20251124T111500Z/benchmarks/20251220T101741Z/`
- 追加/更新内容
  - `bench.config.json` を作成（baseUrl と認証ヘッダを設定済み）。
  - `k6-orca-master.js` / `autocannon-orca-master.js` を調整（ETag を事前取得して If-None-Match を付与、304 応答を狙う）。
  - `asOf` / `tensuVersion` をサーバー側バリデーション（YYYYMMDD / 6桁）に合わせて修正。

## 未実施の理由
- 実行ツール未インストール（k6 / autocannon）。
- そのためベンチの P99 計測は未実施。

## 次アクション
- k6 / autocannon をインストールして実行。
- 結果を `artifacts/api-stability/20251124T111500Z/benchmarks/<RUN_ID>/` に保存し、本メモに追記する。
