# UX ドキュメント計画（RUN_ID=20251202T090000Z）

- 参照元: [src/webclient_screens_plan/01_phase2/screens 3 文書の棚卸.md](../../../src/webclient_screens_plan/01_phase2/screens%203%20文書の棚卸.md)
- 証跡ログ: [docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md](../../server-modernization/phase2/operations/logs/20251202T090000Z-screens.md)
- 目的: Phase2 の Reception / Chart Entry / Patients+Administration 画面で整理したユースケース・API・遷移・認証前提を UX 草稿に反映し、RUN_ID を揃えたまま実装/検証へ引き継ぐ。

## 1. ドラフト状況
| ドキュメント | 状態 | 最終更新 | 備考 |
| --- | --- | --- | --- |
| [reception-schedule-ui-policy.md](reception-schedule-ui-policy.md) | 下書き反映済 | 2025-12-02 | 受付一覧のユースケース・API 依存を棚卸しから移植。ORCA エラー共有と戻り導線の検証 pending。 |
| [charts-claim-ui-policy.md](charts-claim-ui-policy.md) | 下書き反映済 | 2025-12-02 | タブ構成・右カラム・API 依存を移植。ORCA エラー/病名未紐付バナーの tone/aria-live を調整予定。 |
| [patients-admin-ui-policy.md](patients-admin-ui-policy.md) | 下書き反映済 | 2025-12-02 | Patients 編集と Administration 設定の役割/権限/配信前提を移植。配信タイミングと監査ログの検証を残課題として管理。 |

## 2. 進行ルール（Phase2）
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本計画 → 各 UX 草稿。
- RUN_ID=`20251202T090000Z` を README / DOC_STATUS / manager checklist / 証跡ログで揃える。派生 RUN_ID が必要な場合は親 RUN_ID を明記する。
- ORCA 連携や API 仕様に触れる検証は `docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md` に追記し、必要に応じて ORCA Runbook へリンクを張る。

## 3. 検証観点（自動化候補）
- ORCA 送信結果/病名未紐付などのバナー tone と `aria-live`（polite/assertive）の一貫性チェック。復帰時の状態保持を Reception/Charts で合わせる。
- ステータス変更（受付→診療終了）や送信キュー投入の完了/エラー文言がライブリージョンで読まれることを Playwright で確認。
- Patients/Administration からの戻り導線（履歴戻る/専用リンク）でフィルタ状態や保険/自費モードが保持されること。
- 権限ガード（role/承認状態）に応じたボタン活性・タブ表示・監査ログ発火を UI と API レスポンスでクロスチェック。
- ORCA 送信キューの投入/再送トリガー後にバナーへ反映されるまでの遅延とリトライ導線を計測し、Playwright で期待秒数内に更新されることを確認。
- フィルタやタブ切替後のリロード/オートリロードでもクエリパラメータやストレージに保存した条件が復元されること。

## 4. 次ステップ
- ORCA エラー共有バナーと病名未紐付警告の tone/aria-live を Reception/Charts で統一し、Playwright ケースの前提を本計画に記録する。
- Patients からの戻り導線と Administration からの設定配信タイミング（即時/次回リロード）を確認し、監査ログ要件と合わせて各ポリシーに追記する。
- README / manager checklist で UX 草稿更新を周知し、DOC_STATUS の UX/Features 行に反映済みの旨を維持する。
