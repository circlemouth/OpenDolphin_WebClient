# 00_RUN_IDと参照チェーン整理 (RUN_ID=20251201T053420Z)

期間: 2025-12-01 09:00 〜 2025-12-02 09:00 (JST)

## ゴール
- RUN_ID=`20251201T053420Z` を AGENTS → Web クライアント README → サーバー Index → マネージャー資料のチェーンで共有し、証跡・DOC_STATUS へ同一値を記録する。
- `docs/web-client/planning/phase2/screens` 以下の 3 本の画面案を確認し、Login 画面以外の拡張が必要な領域をチームに明示する。
- Web クライアント側制約と ORCA 接続ルールを改めて整理し、周知用メモとして残す。

## 参照チェーン整理
1. `AGENTS.md`（高速開発の最低ルール、Python実行禁止や Legacy/`server/` 触れない制約、RUN_ID と DOC_STATUS 運用を明記）。
2. `docs/web-client/README.md`（ログイン画面しか稼働しておらず、Phase2 ガバナンスチェーンの履行・RUN_ID 共有を必須とするハブ）。
3. `docs/server-modernization/phase2/INDEX.md`（サーバーモダナイズ資料全体の入口。ORCA トライアルへのアクセス制限や RUN_ID 運用・DOC_STATUS 更新順序を再掲）。
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` および `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`（AGENTS → README → INDEX → マネージャー資料の巡回順を踏襲し、マネージャー経由で Web クライアント ORCA 連携・UX 変更を見張る）。

## 画面計画ドキュメント棚卸し
- `docs/web-client/planning/phase2/LOGIN_REWORK_PLAN.md`（現在のログイン構成を再構成した唯一の稼働画面。`LoginScreen.tsx` + `main.tsx` を中心に `npm run build` が通る状態が証跡化済み）。
- `docs/web-client/planning/phase2/screens/RECEPTION_SCREEN_PLAN.md`（受付状況処理画面の設計ドラフト）。
- `docs/web-client/planning/phase2/screens/CHART_ENTRY_SCREEN_PLAN.md`（カルテ記入画面の設計ドラフト）。
- `docs/web-client/planning/phase2/screens/CHART_ADMIN_SCREEN_PLAN.md`（カルテ管理/監査画面の設計ドラフト）。

`docs/web-client/README.md` が示すとおり、現状の Web クライアントは Login 画面のみのため、Reception/Chart Entry/Chart Admin は画面拡張フェーズで初めて具現化する計画領域になります。Screen フォルダの 3 本はコンセプトドラフトにとどまっているため、実装対象の画面（例: ChartsPage、ReceptionPage、PatientsAdminPage など）と対応する計画メモを優先して整備する必要があります。未着手の画面が出た場合は `docs/web-client/planning/phase2/screens` に追加し、DOC_STATUS 備考へ RUN_ID `20251201T053420Z` を記載してください。

## 制約と ORCA 接続ルールの再確認
- Python スクリプトの実行は禁止。必要な処理は `npm`/`node`/シェルで完結させるか、明示指示を待つ。
- `server/` 配下の旧資産や Legacy `client/`/`common/`/`ext_lib/` は参照専用。手元での保守や変更は行わない。
- WebORCA 接続先・認証情報は `docs/web-client/operations/mac-dev-login.local.md` に記された開発用設定のみ参照し、WebORCA トライアル以外へのアクセスや `curl --cert-type P12` を使った通信、公開/本番 ORCA への直接アクセスは禁止。サーバー側の ORCA 接続プロセスの整備状況は `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` / `ORCA_API_STATUS.md` で追跡し、`docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` へ結果を上げてもらう。
- DOC_STATUS 更新後は、備考に RUN_ID/証跡パスを添えて、`docs/web-client/README.md` および `docs/server-modernization/phase2/INDEX.md` に同日付でリンクする。

## 証跡構成
- 証跡メモ: `docs/server-modernization/phase2/operations/logs/20251201T053420Z-run-id-chain.md`
- DOC_STATUS 備考案: 「RUN_ID=`20251201T053420Z` で参照チェーンと画面棚卸しを整理、上記証跡ログと同期中。」

## 次アクション
1. DOC_STATUS の備考行に `RUN_ID=20251201T053420Z` と新規証跡ログへのリンクを追記し、README/INDEX とのリンク整合を確認する。
2. `docs/web-client/README.md` および関連 manager checklist へ本件 RUN_ID を短くメモし、ガバナンスチェーンの更新状況を記録。
3. Reception/Chart Entry/Chart Admin に加えて、Patients/Admin や Schedule 系の画面に対する追加ドキュメントも並行で計画し、Phase2 での画面拡張優先リストをチームで固める。

