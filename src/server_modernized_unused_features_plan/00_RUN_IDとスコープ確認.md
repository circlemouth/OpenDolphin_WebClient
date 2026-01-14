# 00 RUN_ID とスコープ確認

- RUN_ID: `20260114T001728Z`
- 期間: 2026-01-14 09:30 〜 2026-01-15 09:30 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/server_modernized_unused_features_plan/00_RUN_IDとスコープ確認.md`

## 目的
- 「Webクライアント未使用の機能を server-modernized に漏れなく実装する」計画の開始 RUN_ID を明文化する。
- 対象スコープと参照チェーンを明示し、後続タスクの実装・試験の前提を固定する。

## RUN_ID ルール
- RUN_ID は `YYYYMMDDThhmmssZ`（UTC）で採番する。
- 本ガント内で派生 RUN を作る場合は、親 RUN_ID（本ファイル）をログ先頭・報告に必ず明記する。

## 参照チェーン（必読）
1. `docs/DEVELOPMENT_STATUS.md`
2. `docs/web-client-unused-features.md`
3. `server-modernized/src/main/java/*`（Resource / Service / Transport / DTO）
4. `server-modernized/src/main/resources/orca/stub/*`
5. 本ガント（本ファイル）

## 対象スコープ（実装対象）
- ORCA wrapper（JSON）: 予約/受付/請求試算、患者同期バッチ/検索/保険
- ORCA公式 XML プロキシ（XML）: acceptlstv2 / system01lstv2 / manageusersv2 / insprogetv2
- ORCA内製ラッパー（JSON・stub混在）: 診療セット/点数同期/出産育児/診療記録/患者更新/主訴登録
- Legacy REST: PVT/Appo/Karte/Stamp/Patient/Letter/Schedule/Reporting/Lab/MML/ChartEvent/System/ServerInfo/Demo
- Touch / ADM / PHR 系: touch/adm20/adm10 までの関連 Resource 群

## Done 定義（本計画全体）
- 入口 Resource・Service・Transport・DTO・Stub が不足なく揃う。
- 対象 API のテスト（unit/integration/疎通のいずれか）が通る。
- 実測・ログ・更新ドキュメントが RUN_ID 付きで残る。

## ローカル検証（前提）
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- ログイン情報: `setup-modernized-env.sh` 記載のものを使用する。
