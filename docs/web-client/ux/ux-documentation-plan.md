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

## 7. API 統合設計フロー（RUN_ID=20251204T120000Z）

- `web-client/src/libs/http/httpClient.ts` に追加した `OUTPATIENT_API_ENDPOINTS` には `/api01rv2/claim/outpatient/*`、`/api01rv2/appointment/outpatient/*`、`/orca21/medicalmodv2/outpatient`、`/orca12/patientmodv2/outpatient` を登録し、`docs/web-client/architecture/web-client-api-mapping.md` と同じ表を参照用に保持しています。新しい RUN_ID ではこれらに `runId`/`dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed`/`dataSourceTransition` を全例で `audit.logUiState`/`AuditTrail` に透過し、UX ではバナー/ARIA のトーンと一致させることを前提とします。
- `resolveMasterSource(masterType)` の `dataSource` 判定は `MSW fixtures` → `snapshot artifacts` → `server ORCA` → `fallback constants` という旗振りで `dataSourceTransition=server` になるケースを図示し、Playwright/Stage の `warning banner tone=server` で `dataSourceTransition` を `auditEvent` と `data-run-id` で観測できるようにします。

```
(MSW fixtures) --[flags／health fail]--> (snapshot artifacts) --[flag=server + reachable]--> (server ORCA-05/06/08)
        ^                                              |                                      |
        |                                              v                                      v
      [cacheHit=true]                           [dataSourceTransition=server]          [fallbackUsed=true]
``` 

- `cacheHit` は React Query のキャッシュ命中時に `true` を付与し、強制リフェッチや TTL 経過時に `false` とする。`missingMaster` はスキーマ検証や `resolveMasterSource` が `fallback` を選択したときに `true`、解消したら `false` に戻す。`auditEvent` の `details` は `ORCA_CLAIM_OUTPATIENT` / `ORCA_APPOINTMENT_OUTPATIENT` / `ORCA_MEDICAL_GET` / `ORCA_PATIENT_MUTATION` として `facilityId`/`patientId`／`appointmentId`／`operation` などの業務キーと metadata をすべて含めます（詳細は `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md` を参照）。
- `docs/web-client/ux/ux-documentation-plan.md` ではこの図を UX/Playwright 検証の前提として使い、DocStatus の「Web クライアント UX/Features」行に RUN_ID `20251204T120000Z` と `docs/server-modernization/phase2/operations/logs/20251204T120000Z-integration-design.md` / `artifacts/webclient/ux-notes/20251204T120000Z-integration-design.md` を紐づけます。

## 8. 20251204T160000Z Reception UX 設計とステークホルダー同期
- 期間: 2025-12-11 09:00 - 2025-12-12 09:00（優先度: high / 緊急度: medium）。Reception/OrderConsole を `tone=server` バナー・`aria-live` 共同ルール・`dataSourceTransition` 監査メタでつなぎ、ステークホルダーとの同期を確実にする定例レビューを実施した。
- 実施内容: `docs/web-client/ux/reception-schedule-ui-policy.md` に書かれた Reception 一覧/バナー要件を OrderConsole にキャリーオーバーし、`[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション]` という文言構造と Error/Warning/Info の色と `role=alert` + `aria-live` を統一。`src/LEGACY/webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の `resolveMasterSource(masterType)` helper から `dataSourceTransition` を取り込む監査メタルートを Reception/OrderConsole でも再利用することを確認した。
- 証跡: `artifacts/webclient/ux-notes/20251204T160000Z-reception-design.md` にスクリーンショット候補とコード参照を整理し、API 依存・監査ステータスを `docs/server-modernization/phase2/operations/logs/20251204T160000Z-reception-design.md` へ記録。DOC_STATUS の Web クライアント UX/Features 行には RUN_ID=`20251204T160000Z` と本ログ/アーティファクトへのリンクを追記する予定。

## 9. 20251211T090000Z Reception UX 設計とステークホルダー同期（04A1準備）
- 期間: 2025-12-11 09:00 - 2025-12-12 09:00 JST。CodexCLI1 `04A1 WEBクライアント受付UX設計とステークホルダー同期` タスクでは、`docs/web-client/ux/reception-schedule-ui-policy.md` を再読し、Reception/OrderConsole 両面で `tone=server` バナー・`dataSourceTransition` 表現・`resolveMasterSource` 由来の監査メタを共通化してステークホルダー同期資料を整備する。
- 実施内容: Reception のバナー色/ARIA/文言構造と OrderConsole の `FilterBadge`/`DataSourceBanner` を `tone=server` ルートで合わせつつ、`AuditEvent` と `audit.logUiState` 側に `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を添える設計を確認。`resolveMasterSource(masterType)` の実装図（MSW→snapshot→server→fallback）を `artifacts/webclient/ux-notes/20251211T090000Z-reception-design.md` にまとめ、監査メタと UI トーンを紐づけたコード片も記録する。
- 証跡: `artifacts/webclient/ux-notes/20251211T090000Z-reception-design.md` にはスクリーンショット候補（Reception header + OrderConsole tone=server バナー）とコード参照を記載し、`docs/server-modernization/phase2/operations/logs/20251211T090000Z-reception-design.md` で API 依存・監査メタ要求・DOC_STATUS/manager checklist への反映計画を記録。`src/outpatient_ux_modernization/04A1_WEBクライアント受付UX設計とステークホルダー同期.md` で RUN_ID と deliverable を整理し、`docs/web-client/planning/phase2/DOC_STATUS.md` `Web クライアント UX/Features` 行に新 RUN_ID を追記する準備を進める。
## 10. 20251212T090000Z Charts/Patients ORCA tone実装

- DocumentTimeline/OrderConsole/OrcaSummary と Patients ヘッダー/行に `missingMaster` バナーと `dataSourceTransition=server` 表示を導入し、`auth-service.tone=server` フラグを gate に `Warning` → `Info` へ tone を切り替える UX を整備。`data-run-id=20251212T090000Z` を持つ `role=alert` ライブリージョンで Reception 側の carry over ルールと完全に同期させ、`aria-atomic=false` を使って二重読み上げを防止しました。
- `artifacts/webclient/ux-notes/20251212T090000Z-orca-flags.md` には Stage/Preview (`VITE_DISABLE_MSW=1`, `VITE_DEV_PROXY_TARGET=http://100.102.17.40:8000/openDolphin/resources`) で観測した ORCA `cacheHit`/`missingMaster`/`dataSourceTransition` を記録し、スクリーンショット付きで DocumentTimeline のバナーと OrderConsole/OrcaSummary の `dataSourceTransition=server` を残しています。
- 本 RUN_ID の動作確認・実装結果は `docs/server-modernization/phase2/operations/logs/20251212T090000Z-charts-orca.md` にログ化済み。DOC_STATUS の `Web クライアント UX/Features` 行には RUN_ID=`20251212T090000Z`・本ログ・artifact (`artifacts/webclient/ux-notes/20251212T090000Z-orca-flags.md`)・doc (`src/outpatient_ux_modernization/04B2_WEBクライアントChartsPatientsUX実装.md`) を併記しました。
- 次ステップとして Playwright ケースに `missingMaster` → `cacheHit` → `dataSourceTransition=server` の tone chain を組み込み、`docs/web-client/ux/playwright-scenarios.md` へ `auth-service` flag 切替の前提を追記する予定です。
