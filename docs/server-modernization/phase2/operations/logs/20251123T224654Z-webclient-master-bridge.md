# 20251123T224654Z Webクライアント マスターデータ暫定方針ログ

- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md
- 背景: ORCA マスターデータ不足により Charts/予約/請求 UI の候補・禁忌・バリデーションが欠落するため、Web クライアント側で暫定供給/キャッシュ/検証を設計する。
- 目的: RUN_ID=`20251123T224654Z` として暫定データ供給・MSW フォールバック・監査メタ（dataSource/cacheHit/validationStage）追加方針を記録し、実装作業に引き継ぐ。
- 成果物ドラフト:
  - 方針ドキュメント: `src/webclient_modernized_bridge/03_ギャップ解消方針とUI影響分析.md`
  - 予定アーティファクト: `artifacts/api-stability/20251123T224654Z/master-snapshots/`（匿名化 CSV/JSON と MSW 追記差分）
- メモ: サーバーコードは変更しない。MSW/フロントのみで暫定運用を実施し、恒久 API 実装は ORCA-05/06/07 タスクへ委譲する。
