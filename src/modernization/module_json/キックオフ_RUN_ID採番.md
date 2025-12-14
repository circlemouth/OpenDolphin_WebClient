# module_json キックオフ & RUN_ID 採番

- RUN_ID: `20251214T022944Z`
- 期間: 2025-12-15 09:00 〜 2025-12-16 09:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/modernization/module_json/キックオフ_RUN_ID採番.md`

## 目的
- module_json モダナイズ計画を開始するにあたり、基準 RUN_ID を固定し、以降の DOC_STATUS・証跡ログで同一値を使用する。
- 参照チェーン遵守（AGENTS → Web クライアント README → server-modernization INDEX → マネージャーチェックリスト）と Legacy 資産非改変の方針をチームで再確認する。
- PM/レビュアーを明確化し、後続タスク（ModuleModel フィールド拡張／Flyway／Converter／組み込み／検証）への依存を整理する。

## RUN_ID ルール
- RUN_ID は `YYYYMMDDThhmmssZ`（UTC）で採番し、本計画では `20251214T022944Z` を親 RUN とする。
- 派生 RUN を作る場合は親 RUN_ID を備考と証跡ログ先頭に併記し、DOC_STATUS/README でも同じ親子関係を明記する。

## 参照チェーン（必読）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
5. 本ガント（本ファイル）

## スコープと前提
- 対象: module_json モダナイズ（module 保存形式の JSON 化と互換維持）。
- Legacy 資産（`server/`, `client/`, `common/`, `ext_lib/`）は参照専用とし、本計画では変更しない。
- モダナイズ版サーバーと Web クライアントの接続検証は `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を前提とし、ログイン情報は同スクリプト記載のものを用いる。

## 証跡・同期
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251214T022944Z-module-json-kickoff.md`
- DOC_STATUS: `docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID と証跡パスを追記する。
- ハブ更新: `docs/web-client/README.md` に本計画開始（2025-12-14）を反映する。

## 役割
- PM: TBD / レビュアー: TBD（キックオフ時に確定し、証跡ログへ記録）

## 次アクション（後続タスクへの橋渡し）
- `ModuleModelフィールド拡張.md`（beanBytes nullable + beanJson 追加）を着手可能な状態にする。
- `Flywayスクリプト追加.md` / `ModuleJsonConverter実装.md` / `KarteServiceBean組み込み.md` の依存関係を DOC_STATUS 備考でトラッキングする。
