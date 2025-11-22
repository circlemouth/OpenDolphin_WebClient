# 09_統合 E2E 接続確認（Web クライアント連携）

- RUN_ID: `20251120T131731Z`
- 期間: 2025-12-12 09:00 〜 2025-12-17 09:00 (JST)
- 優先度: High / 緊急度: Low
- エージェント: claude code
- YAML ID: `src/modernized_server/09_統合E2E接続確認（Webクライアント連携）.md`

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## 禁止事項 / 前提
- `server/` 配下やサーバースクリプトの変更は禁止。Legacy 資産（`client/` `common/` `ext_lib/`）は参照のみ。
- Python スクリプト実行は禁止（明示指示がある場合のみ例外）。CLI/ブラウザ操作・既存シェルツールのみ使用可。
- WebORCA/モダナイズ接続は開発用設定に限定し、P12 証明書・本番経路・ローカル ORCA コンテナ・`curl --cert-type P12` は使用しない。接続情報は `docs/web-client/operations/mac-dev-login.local.md` 参照。
- RUN_ID は `20251120T131731Z` で統一し、ログ・証跡・DOC_STATUS・報告草案すべて同一値を用いる。派生 RUN_ID を作る場合は親 RUN_ID を明示する。
- Web クライアント側のソース改修は本タスクのスコープ外。挙動差分はサーバー側対処可否を仕分け、クライアント連携チームへエスカレーションする。

## ゴール
- 開発中 Web クライアントとモダナイズ版サーバーを接続し、認証・主要業務フロー・エラーハンドリングの E2E を実測する。
- サーバー側で解決可能な課題（設定/互換レイヤー/データ seed）とクライアント側エスカレーション項目を仕分け、優先度付きで整理する。
- 実測結果・証跡・再現手順を `docs/server-modernization/phase2/operations/logs/20251120T131731Z-e2e.md` と `artifacts/e2e-connect/20251120T131731Z/` に集約し、DOC_STATUS へ連携可能な状態にする。

## スコープ / 非スコープ
- スコープ: 認証/セッション更新、受付/予約フロー、カルテ閲覧・保存系（DocInfo/ChartEvent）、ORCA ラッパー経由の代表 API、エラーハンドリング（トークン失効・4xx/5xx・ネットワーク遮断）を Web クライアント UI 経由で実測。
- 非スコープ: Web クライアントの UI/UX 改修、サーバーコード変更、ORCA 本番接続、CI/CD 設定変更、Python スクリプトによる自動化。

## 期待アウトプット（DoD）
1. E2E シナリオ一覧（認証/受付/予約/カルテ/ORCA 呼び出し/エラー系）がログに整理され、各シナリオの結果・証跡パス・判定（Pass/Fail/Blocked）が記録されている。
2. サーバー側で対処可能な項目とクライアントエスカレーション項目が仕分け表になっており、担当/優先度/次アクションが明記されている。
3. 証跡（HAR/HTTP dump/スクリーンショット/サーバーログ抜粋）が `artifacts/e2e-connect/20251120T131731Z/` に保存され、ログから参照できる。
4. RUN_ID=`20251120T131731Z` を `DOC_STATUS.md` 備考欄へ反映できる準備が整い、ハブドキュメント（Web クライアント README / Phase2 INDEX）と同日付で同期可能な状態になっている。

## タスク分解
- **A. 参照チェーン確認と RUN_ID 宣言**
  - 本ファイルとログ冒頭に RUN_ID・期間・証跡パスを明記し、関連チェックリストと整合を取る。
- **B. 環境ベースライン確立**
  - `mac-dev-login.local.md` を参照し、モダナイズ版サーバー接続先・資格情報・MSW 無効化手順を確認。必要に応じて `npm run preview -- --host` で実サーバー接続に切替える。
  - サーバー側ログ取得方法（`server_latest_logs.txt` ほか）とブラウザ HAR/コンソール収集手順を決定。
- **C. シナリオ設計（E2E パス）**
  - 認証/セッション延長、受付検索・登録、予約作成/更新、カルテ閲覧/保存（DocInfo/ChartEvent）、ORCA ラッパー経由 API（acceptmod/appointmod 等）を想定し、前提データと期待結果を整理。
  - エラー系（トークン失効、ネットワーク遮断、HTTP 4xx/5xx）の再現手順と期待 UI 挙動を定義。
- **D. 実測と証跡収集**
  - シナリオを実行し、HAR/HTTP dump/スクリーンショット/サーバーログを `artifacts/e2e-connect/20251120T131731Z/` に保存。成功/失敗条件を明記。
- **E. 仕分け・エスカレーション**
  - サーバー側で完結する課題（設定/seed/互換レイヤー）とクライアント連携が必要な課題を一覧化し、対応者/期限/必要ドキュメントを記載。
- **F. ドキュメント連携**
  - `docs/server-modernization/phase2/operations/logs/20251120T131731Z-e2e.md` を更新し、必要に応じて `DOC_STATUS.md` とハブドキュメントへ RUN_ID・備考を反映。

## 証跡配置
- ログ: `docs/server-modernization/phase2/operations/logs/20251120T131731Z-e2e.md`
- アーティファクト: `artifacts/e2e-connect/20251120T131731Z/{har,httpdump,screenshots,server-logs}/`

## スケジュール目安
- 12/12 (Day1): 参照チェーン確認、環境ベースライン確立、シナリオ草案作成。
- 12/13 (Day2): 認証/受付/予約シナリオの実測と証跡収集。
- 12/14 (Day3): カルテ/ORCA 呼び出し・エラー系シナリオ実測、仕分け表初版作成。
- 12/15 (Day4): 再現/フォローアップ、エスカレーション内容確定、ログ整理。
- 12/16〜12/17 09:00: DOC_STATUS 連携と引き継ぎメモを添付してクローズ。

## リスクと留意点
- ORCA Trial 由来の 404/405 や seed 不足で成功シナリオが揃わない可能性 → Blocker として明記し、代替手段（モダナイズ側スタブ/互換レイヤー/seed 手順）を提案する。
- MSW やブラウザキャッシュが実サーバー計測を妨げるリスク → 実施前に Service Worker/キャッシュを無効化し、`VITE_DEV_PROXY_TARGET` の向き先を確認する。
- 認証トークン有効期限や同時ログイン制限で再現が不安定になるリスク → セッション延長手順を準備し、失効時の UI/HTTP 応答を証跡に残す。
- 証跡に機微情報が混入しないよう、ログ保存時はマスキング（患者 ID / トークン）と匿名化を徹底する。
