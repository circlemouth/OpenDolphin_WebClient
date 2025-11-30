# API サーフェス & 監査 UX ガイド（RUN_ID=20251116T170500Z）

Web クライアントが REST API を呼び出す導線をページ単位で整理し、監査ログやレイアウト上のガードをまとめたガイド。`docs/web-client/architecture/REST_API_INVENTORY.md` の UI ステータス列と同期し、Reception/Admin/Charts 各領域で「どのロールがどの UI から API を実行するか」を即時に確認できるようにする。

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` → `docs/web-client/architecture/REST_API_INVENTORY.md` → `docs/web-client/process/API_UI_GAP_ANALYSIS.md`
- RUN_ID=`20251116T170500Z` の成果は `docs/server-modernization/phase2/operations/logs/20251116T170500Z-orca-ui-sync.md` に証跡化し、DOC_STATUS 備考へ同一 ID で記載する。

## 1. ページ別 API / ロール / 監査マッピング

| ページ / コンポーネント | 主な API | ロール | レイアウト / 導線 | 監査・RUN ルール |
| --- | --- | --- | --- | --- |
| [SystemPreferencesPage](../architecture/WEB_CLIENT_REQUIREMENTS.md#systempreferences) | `/user/facility`, `/dolphin/*`, `/serverinfo/*` | SystemAdmin / Ops | Administration グループの「システム状態」「Cloud Zero」「Facility」カードに集約。 | 変更系は `audit.logAdministrativeAction` を強制。Evidence を `operations/logs/20251116T170500Z-orca-ui-sync.md#system-preferences` へ追記。 |
| [UserAdministrationPage](../architecture/WEB_CLIENT_REQUIREMENTS.md#administration) | `/user*` | SystemAdmin | SurfaceCard + 詳細ドロワ。右ペインで CRUD。 | 実行時に `audit.logUserMutation` を呼び、実行者/対象/role を記録。削除は Phase6 Danger 操作を別枠に表示。 |
| [ReceptionPage](../features/RECEPTION_SCHEDULE_AND_SUMMARY.md) + [VisitManagementDialog](../features/RECEPTION_SCHEDULE_AND_SUMMARY.md#visitmanagementdialog) | `/patient/pvt*`, `/pvt*`, `/pvt2*`, `/patient/documents/status` | Reception Clerk / Lead | 左カラムカード + 右サイドバー／詳細ダイアログ。 | `audit.logReceptionAction` で受付番号/担当者/メモ更新を残す。Legacy API は「詳細操作」タブに隔離し、Warning トーンで表示。 |
| [FacilitySchedulePage](../features/FACILITY_SCHEDULE_VIEW.md) | `/schedule/pvt*`, `/schedule/document`, `/appo` | Reception Lead | 予約リスト → 予約詳細ダイアログ。 | カルテ自動生成や予約削除は `audit.logScheduleAction` を必須化。RUN_ID をモーダルフッターに表示して Evidence と結び付ける。 |
| [PatientDataExportPage](../features/PATIENT_MANAGEMENT_GUIDE.md#patientdataexport) | `/patient/all`, `/patient/custom/*`, `/patient/count/*` | SystemAdmin | Administration > Patient Export。CSV/JSON 出力カード＋条件フィルタ。 | ダウンロード時に `audit.logDataExport` を送信し、`artifacts/patient-export/` へファイルと RUN_ID を保存。 |
| [ChartsPage](../ux/KARTE_SCREEN_IMPLEMENTATION.md)（DocumentTimelinePanel / DiagnosisPanel / ObservationPanel / ClaimAdjustmentPanel / MedicalCertificatesPanel） | `/karte/*`, `/lab/module`, `/letter/*`, `/mml/*` | Physician / Billing | 三カラム構成（左: タイムライン、中: SOAP、右: オーダ/結果）。 | すべての保存/再送信を `audit.logChartsAction` で記録。Claim 再送信は `audit.logBillingAction` も併記。 |
| [StampManagementPage](../features/PHASE3_STAMP_AND_ORCA.md#stamp-management) + [OrcaOrderPanel](../features/PHASE3_STAMP_AND_ORCA.md#orca-order-panel) | `/stamp/*`, `/orca/inputset`, `/orca/stamp`, `/orca/tensu/*`, `/orca/disease/*`, `/orca/interaction` | Physician / Admin | Administration > Stamp と ChartsPage 右ペイン。 | `audit.logStampMutation` / `audit.logOrcaQuery` で DTO をマスク保存。禁止語句は `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` に準拠。 |
| [AppShell](../operations/RECEPTION_WEB_CLIENT_MANUAL.md#64-ui-ワイヤーフレームと通知バリアント) + [ReplayGapProvider](../ux/CHART_UI_GUIDE_INDEX.md#4-運用・監査観点での-ui-要件) | `/chartEvent/subscribe`, `/chartEvent/event`, `/chartEvent/dispatch` | All | グローバルバナー/トーストと `ReplayGap` 状態管理。 | `chart-events.replay-gap` を受信したら `audit.logReplayGapState` を送出し、ops ログへリンク。ChartsHeader/ReceptionHeader に `ChartSyncStatus` を追加し、gapSize/sequence/Last-Event-ID・`rest/charts/patientList?clientUUID=<UUID>&sequence=<ID>&gapSize=<N>` を可視化しながら `audit.logReplayGapState(action="manual-resync")` を記録。AppShell ヘッダーに SSE バッファゲージを置き、90 件以上で長時間フェールオーバーモーダルを開く。Replayer UI（`ChartSyncReplayReplayer`/`ChartSyncReplayBanner`）や `ReplayGapContext.manualResync` を共有し、Implementation/UX チームとのレビューで Runbook（`docs/server-modernization/phase2/operations/logs/20251129T105517Z-realtime.md`）と `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` の gapSize＝`sequence-oldestHistoryId` ルールを言及。証跡: `docs/server-modernization/phase2/operations/logs/20251129T105517Z-realtime.md`（gap 操作 + Ops Runbook 参照）。 |

### Reception/VisitSidebar UX モック（RUN_ID=20251129T150500Z）

- 来院一覧の各行はステータス色・担当者アイコン・RUN_ID タグをもち、本日来院/担当医/Charts 編集中の文脈をフィルタ＋Tooltip で示す。プリセットボタン（本日来院・ドクター待ち・RUN_ID）とカラーコード付きアイコンで注視対象を分類し、来院内容とカルテ状態を結びつける。
- VisitSidebar は折りたたみ＋通知バッジを採用し、展開時に共有 RUN_ID・通知された担当者・Charts へのジャンプリンクを提示。Shared Draft が変化した際には `logReceptionAction` に `runId=session.runId` を自動送信し、ReceptionPage/Sidebar/監査ログの RUN_ID を一致させるフローを示す。
- Danger タブは警戒色＋ 2 段階確認（チェックボックス＋操作意図メモ）で操作を包み、確認済みの操作には VisitSidebar から自動送信された RUN_ID を `logReceptionAction` に添えて監査ログへ送信する。UX モックに記したゴースルーは docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md の該当項で参照し、Evidence パスも書き添える。
- Danger タブの二段階確認（チェックボックス＋メモ）と `logReceptionAction(session.runId)` 呼び出しは Implementation/UX チームのレビューで確認済み。Evidence: `docs/server-modernization/phase2/operations/logs/20251129T150500Z-reception.md`。
### RUN_ID=20251129T163000Z: FacilitySchedule & PatientDataExport
- FacilitySchedule の予約ダイアログに `ChartLinkPanel` を設置し、担当医/予約状態/RUN_ID を InfoBanner で強調し、`Charts` へのジャンプボタンに `audit.logChartsAction`（`runId=session.runId`）を送出しつつ `docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#facilityschedule-chart-link` へ Evidence を付与する。OperationHistoryPanel は TooltipFields 付きの badge/tooltip/証跡リンクを並べ、`audit.logScheduleAction(runId=20251129T163000Z, evidencePath=このドキュメント)` を明示した履歴ラインを表示する。
- RunIdHistoryCollapse では過去 RUN_ID を時系列でリストアップし、DangerZone に患者ID＋予約IDの再入力＋チェックボックス2種＋3秒フォーカス遅延の二段階確認を入れ、削除ボタンに `data-run-id` を付与して `logScheduleAction(action="danger-delete", runId=20251129T163000Z)` の Evidence を `#facilityschedule` に紐付ける。
- PatientDataExport は ChartsContext の患者/期間プリセットを InfoCard で再掲し、「Start Export from Charts」ボタンで sessionStorage からプリセットを拾って条件欄へ反映、`logAdministrativeAction(runId=20251129T163000Z)` で変更履歴を記録。ファイル名は `patient-data-export-<facility>-<chartId>-<YYYYMMDD>-<RUN_ID>.csv/.json`、CSV 頭に `# RUN_ID=20251129T163000Z` コメント、JSON には `metadata.runId/chartId/evidencePath` を含め、ダウンロードボタンには `data-audit-intent="export"`・`aria-label="RUN_ID=20251129T163000Z で出力"` を付与し `logAdministrativeAction`（`audit.logDataExport` 相当）で `artifacts/patient-export/` ならびに `docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#patientdataexport` へのリンクを整える。
- Implementation/UX チームのレビューで `audit.logScheduleAction`/`audit.logChartsAction`/`audit.logDataExport` に `runId=20251129T163000Z`・`evidencePath`・`actorRole` が含まれていることを確認済みであり、Playwright などで Danger 操作と Export の監査カバレッジを追跡する次ステップも併記している。
- Playwright `tests/e2e/facility-schedule.spec.ts` を `RUN_ID=20251129T163000Z VITE_RUN_ID=20251129T163000Z VITE_DEV_PROXY_TARGET=http://localhost:8000/openDolphin/resources PLAYWRIGHT_BASE_URL=http://localhost:4173` で実行し、DangerZone の 2 段階確認・data-run-id 属性・OperationHistory の runId テキスト、PatientDataExport の `data-run-id` + `aria-label` 付きダウンロードボタンを検証しました。出力ログは `artifacts/e2e/20251129T163000Z/facility-schedule.log`、スクリーンショットは `artifacts/e2e/20251129T163000Z/facility-schedule-danger-zone.png` および `artifacts/e2e/20251129T163000Z/patient-data-export.png`、検証報告は `docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#e2e` に記録しています。


## 2. 監査・UX ガードライン

1. **RUN_ID 表示**: Administration / Reception / Schedule / Export の各ページは実行中 RUN_ID（例: `20251116T170500Z`）をツールバーの `data-run-id` 属性とフッターへ表示し、スクリーンショットで証跡化できるようにする。
2. **Danger 操作の隔離**: Legacy API（`/pvt`、`/user/delete` 等）は「詳細操作」または Danger セクションにまとめ、赤系トーン＋ 2 段階確認（チェックボックスと入力）を義務付ける。
3. **監査 API フック**: すべての書き込み系 UI は `libs/audit` のフックを経由して `action`, `actorRole`, `apiRoute`, `runId`, `evidencePath` を送信する。未実装の場合はこのガイドに TODO を追加し、DOC_STATUS 備考でフォローアップする。
4. **ORCA タイムアウト**: `OrcaOrderPanel` は 5 秒でキャンセルし、`Retry` ボタンに `RUN_ID` と参照 Runbook（`ORCA_HTTP_404405_HANDBOOK.md`）をリンク。Timeout 超過時は自動で `audit.logOrcaTimeout` を送信する。
5. **データエクスポート**: `PatientDataExportPage` とスタンプエクスポートはファイル名に `RUN_ID` を含め (`patient-export-20251116T170500Z.csv`) 、`artifacts/` 側フォルダと operations ログへ同リンクを貼る。

## 3. レイアウト & アクセシビリティ要件

- **ReceptionPage**: VisitSidebar の API 呼び出し結果は `aria-live="polite"` で読み上げ、受付カード削除時は `role="status"` を持つ行に結果を表示する。詳細は `docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md` §4 を参照。
- **SystemPreferencesPage**: ライセンス/Cloud Zero カードは `SurfaceCard` の `tone="warning"` を用い、`aria-describedby` に RUN_ID と証跡パスを紐付ける。これにより Ops が監査対象を特定しやすくなる。
- **ChartsPage**: DocumentTimelinePanel の編集ダイアログは常に元文書タイトルを `aria-label` に含め、`PUT /karte/document` で失敗した場合でも焦点を失わないよう `focus-trap` を維持する。
- **PatientDataExportPage**: ダウンロードボタンには `data-audit-intent="export"` を付与し、スクリーンリーダー向けに「RUN_ID=... で出力」の説明を追加する。

## Administration ⇔ Charts RUN_ID=20251129T105243Z

- SystemPreferencesPage/UserAdministrationPage と共通の `AdminRunIdBanner` を導入し、`data-run-id="20251129T105243Z"` を付けた `StatusBadge`/ログボタンをヘッダー直下に置いた。`audit.logAdministrativeAction` を送る操作中はこのバナーを参照し、`docs/server-modernization/phase2/operations/logs/20251129T105243Z-admin-charts-sync.md#admin-danger-operations` への deep link で証跡を開けることを明記。
- ChartsPage 右ペイン `OrderResultsColumn` 内に `ChartsAdminShortcutCard` を追加し、同じ RUN_ID を `StatusBadge` で再表示。カードには `data-run-id` 属性と 2 本のログリンク（`#charts-status-deep-link`, `#admin-danger-operations`）を持たせ、`SystemPreferences` へのショートカットボタンで `navigate('/administration/system?runId=20251129T105243Z')` が呼ばれることを UX ガイドに書き添える。
- Implementation/UX のレビューや Playwright 補完では、このカードとバナーの表示・リンク先・スクリーンショットをリストアップし、`docs/server-modernization/phase2/operations/logs/20251129T105243Z-admin-charts-sync.md` へのリンクが README/DOC_STATUS 行と一致することを確認してから完了とする。

## 4. 更新手順

1. UI 変更を行ったら `docs/web-client/architecture/REST_API_INVENTORY.md` の該当行で UI ステータスを更新し、本ガイドの表も同じ RUN_ID で修正する。
2. 監査フックや Danger UI に手を入れた場合は `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へステップを追記し、本ガイドからリンクする。
3. DOC_STATUS の Web クライアント行に RUN_ID / 証跡パス / 更新概要を残し、マネージャーチェックリスト（ORCA Sprint2 / Web Client Experience）へ同日反映する。

---

> 本ガイドは `docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md` の姉妹ドキュメントであり、Administration と Reception Page の監査要求に特化している。今後 API 実装範囲が広がった場合は、表へ行を追加し、関連する features/operations ドキュメントと同時に更新すること。
