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

## 5. 20251203T143858Z 外来 UX 要件レビュー
- 目的: `docs/web-client/ux/ux-documentation-plan.md` を起点に reception/patients/Charts 各草稿を再読し、外来カルテ・受付のトーン、レイアウト比率、ARIA/監査要件を整理。Legacy 資料（`docs/web-client/ux/legacy/`）は履歴参照のみとし、入院向け ORCA API やバナーは本レビューの対象外とする。
- フォーカス領域:
  - Reception: 左レールにステータス別タブ・フィルタ・ソートをまとめ、中核の一覧テーブル（患者ID/受診情報/自費アイコン/メモ）を中心に配置、右パネルで基本情報・直近診療・処方/検査概要を補完。ヘッダー直下のバナー領域に Error=赤/Warning=琥珀/Info=青を統一し、`role=alert` + `aria-live=assertive`（エラー/未紐付/遅延）・`aria-live=polite`（完了/情報）を維持。`data-run-id="20251202T090000Z"` などの識別子でスクリーンリーダーが更新を区別できるようにした carry over ルールを Charts と共有する。
  - Charts: ヘッダーに患者基本＋受付情報＋保険/自費トグルを掲示し、SOAP/病名/オーダー/結果などのタブを中央に配した 2 カラム構成。右サイドバーには患者メモ・未紐付チェック・ORCA/病名候補を表示し、`aria-live` バナーと Tone を Reception と揃えた上で診療終了→ORCA 送信の狭間に carry over させる。`aria-live=assertive` の遅延/未紐付/エラーは 1 回だけ announce し、二重読み上げを抑える工夫（`aria-atomic=false`、tone フラグ）を盛り込む。ステータス遷移や再送操作は監査ログへ `action/patientId/queueStatus/tone/ariaLive/runId` を記録。
  - Patients＋Administration: 左メニュー＋右詳細フォームのダッシュボード構成で、Reception からの戻り導線はクエリ＋ローカルストレージでタブ/フィルタ/保険モードを保持。編集後は Reception へ戻れる履歴リンクを残し、権限不足の場合も元の状態に復帰させ監査ログへ拒否理由を記録。Administration の ORCA 設定や配信遅延は Reception/Charts 両方へバナー警告・リトライ導線を提示し、`role=system_admin/管理者` 以外のアクセスを UI 側でブロックするガードを記載する。
- 次の設計メモ: 上記レビューを artifacts/webclient/ux-notes/20251203T143858Z-ux-review.md に書き出し、Playwright シナリオやデザインメモへの受け渡し準備も視野に入れる。

## 6. 外来カルテ UX カバレッジ（RUN_ID=20251203T210000Z）

- `docs/web-client/ux/charts-claim-ui-policy.md` に DocumentTimeline/OrderConsole/OrcaSummary の状態遷移と `aria-live` バナーを追加し、受付側のトーン・`role=alert`・保険/自費モード保持の定義と完全に整合させた。また同文書内に外来 API 専用の coverage table（dataSourceTransition/missingMaster/fallbackUsed を含む）を載せ、入院 API については `N/A` と明示して次ステップの API マッピングに狙いを限定した。
- 本 coverage は `docs/server-modernization/phase2/operations/logs/20251203T210000Z-charts-ux.md` で記録し、次の API マッピングタスクへのインプットを `artifacts/webclient/ux-notes/20251203T210000Z-charts-ux.md` に残した。次のマッピングではこの artifacts を参照して `DocumentTimeline`/`OrcaSummary` の `missingMaster` や `dataSourceTransition` イベントに対応するエンドポイント一覧と監査メタの扱いを固める。
- `DOC_STATUS` ではこの RUN_ID を `Web クライアント/UX` 行に追記し、証跡に本ログと `artifacts/webclient/ux-notes/20251203T210000Z-charts-ux.md` を並べて記録する予定。次の API マッピング・Playwright a11y 拡張ではこの RUN_ID を参照して `aria-live` 分岐及び `dataSourceTransition` 監査要件の実装状況を追跡すること。
