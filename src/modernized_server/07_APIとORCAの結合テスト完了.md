# 07_API と ORCA の結合テスト完了 ✓

- RUN_ID: `20251120T131731Z`
- 期間: 2025-12-08 09:00 〜 2025-12-13 09:00 (JST)
- 優先度: High / 緊急度: Low
- エージェント: cursor cli
- YAML ID: `src/modernized_server/07_APIとORCAの結合テスト完了.md`

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md`

## 禁止事項 / 前提
- `server/` 配下やサーバースクリプトの変更は禁止。Legacy 資産（`client/`, `common/`, `ext_lib/`）は参照のみ。
- Python スクリプト実行は禁止（明示指示がある場合のみ例外）。自動化は `curl` / shell のみで行う。
- ORCA 接続は開発用 ORCA サーバー（`mac-dev-login.local.md` 参照）に限定。P12 証明書や本番経路、ローカル ORCA コンテナ、`curl --cert-type P12` は使用しない。
- RUN_ID は `20251120T131731Z` で統一し、ログ・証跡・DOC_STATUS・報告草案で同一値を使う。

## ゴール
- ドメイン別の代表シナリオを自動化し、WebORCA トライアルで成功/失敗パターンを網羅した結合テスト結果を取得する。
- `ORCA_API_STATUS.md` を根拠に、エンドポイントごとの制約・既知課題を一覧化し、ワーカー報告草案（本タスク用）を準備する。
- テストログを `docs/server-modernization/phase2/operations/logs/20251120T131731Z-orca-tests.md` に記録し、DOC_STATUS 備考へ連携できる状態にする。

## スコープ / 非スコープ
- スコープ: 代表 CRUD シナリオ（受付/予約/診療/PHR/帳票 等）を `curl` ベースで自動化し、成功/失敗双方の挙動を採取。制約・Blocker の整理と報告草案作成。
- 非スコープ: サーバーコード改修、CI/CD 構成変更、本番 ORCA へのアクセス、Legacy 資産の更新。

## 期待アウトプット（DoD）
1. 自動化スクリプトとパラメータセットが `artifacts/orca-connectivity/20251120T131731Z/automation/` に置かれ、再実行手順がログに記載されている。
2. 成功/失敗ケースのリクエスト・レスポンス・ヘッダーが `crud/` 配下に RUN_ID 付きで保存され、カバレッジ表と Blocker 一覧がログにまとまっている。
3. `ORCA_API_STATUS.md` に準拠した制約・既知課題表とワーカー報告草案のドラフトが本ログ/本ファイルに紐付いている。
4. DOC_STATUS 備考欄へ RUN_ID と証跡パスを追記する準備が整い、ハブドキュメントと同日付で同期できる。

## タスク分解
- **A. 参照チェーン確認と RUN_ID 共有**
  - 必読チェーンを確認し、RUN_ID と証跡保存先をログ冒頭へ明記。
- **B. シナリオ設計と自動化**
  - 受付/予約/診療/PHR/帳票など代表 API を `curl` で自動化。パラメータ（timeout/retry/tls）を整理し、成功/失敗を両方再現。
- **C. 実測と証跡保管**
  - WebORCA trial で CRUD を実行し、XML/JSON/ヘッダーを `artifacts/orca-connectivity/20251120T131731Z/crud/` に収集。
- **D. Blocker・制約整理と報告草案**
  - `ORCA_API_STATUS.md` を参照して制約と既知課題を表にまとめ、ワーカー報告草案としてログへ記載。
- **E. ドキュメント連携**
  - ログ（`docs/server-modernization/phase2/operations/logs/20251120T131731Z-orca-tests.md`）を更新し、必要に応じて `DOC_STATUS.md` と README/INDEX を同日付で同期。

## 証跡配置
- ログ: `docs/server-modernization/phase2/operations/logs/20251120T131731Z-orca-tests.md`
- アーティファクト: `artifacts/orca-connectivity/20251120T131731Z/{automation,crud,coverage,blocked}`

## スケジュール目安
- 12/08 (Day1): 参照チェーン確認、シナリオ選定、`curl` パラメータセット設計。
- 12/09 (Day2): 自動化スクリプト作成、主要 API の初回実測と証跡保存。
- 12/10 (Day3): 失敗パターン再現、Blocker/制約表作成、カバレッジ更新。
- 12/11 (Day4): ワーカー報告草案作成、ログ整理、DOC_STATUS 反映準備。
- 12/12〜12/13 09:00: レビュー反映、残課題と再実行条件を明記してクローズ。

## リスクと留意点
- Trial 固有の HTTP405/404 や seed 不足で成功ケースが得られない可能性が高い。Blocker に根拠（trialsite.md/既存ログ）を明記する。
- GUI 端末が確保できない場合は CLI 証跡のみ取得し、UI 未取得と明記する。
- Python 禁止のため自動化は shell/curl/既存 ops ツールに限定する。

## 進捗メモ（RUN_ID=20251120T131731Z）
- 完了 (2025-11-22): 結合テスト実施完了。
- 実施ログ: `docs/server-modernization/phase2/operations/logs/20251122T132337Z-orca-connectivity.md`
- 結果: 主要ドメイン (受付/予約/診療/患者) の CRUD 成功 (HTTP 200)。制約事項は `ORCA_API_STATUS.md` に反映済み。
