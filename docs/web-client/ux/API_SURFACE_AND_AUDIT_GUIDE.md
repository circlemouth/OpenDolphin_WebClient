# API サーフェス & 監査 UX ガイド（RUN_ID=20251116T170500Z）

Web クライアントが REST API を呼び出す導線をページ単位で整理し、監査ログやレイアウト上のガードをまとめたガイド。`docs/web-client/architecture/REST_API_INVENTORY.md` の UI ステータス列と同期し、Reception/Admin/Charts 各領域で「どのロールがどの UI から API を実行するか」を即時に確認できるようにする。

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/web-client/ux/API_SURFACE_AND_AUDIT_GUIDE.md` → `docs/web-client/architecture/REST_API_INVENTORY.md` → `docs/web-client/process/API_UI_GAP_ANALYSIS.md`
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
| [AppShell](../operations/RECEPTION_WEB_CLIENT_MANUAL.md#64-ui-ワイヤーフレームと通知バリアント) + [ReplayGapProvider](../ux/CHART_UI_GUIDE_INDEX.md#4-運用・監査観点での-ui-要件) | `/chartEvent/subscribe`, `/chartEvent/event`, `/chartEvent/dispatch` | All | グローバルバナー/トーストと `ReplayGap` 状態管理。 | `chart-events.replay-gap` を受信したら `audit.logReplayGapState` を送出し、ops ログへリンク。 |

## 2. 監査・UX ガードライン

1. **RUN_ID 表示**: Administration / Reception / Schedule / Export の各ページは実行中 RUN_ID（例: `20251116T170500Z`）をツールバーの `data-run-id` 属性とフッターへ表示し、スクリーンショットで証跡化できるようにする。
2. **Danger 操作の隔離**: Legacy API（`/pvt`、`/user/delete` 等）は「詳細操作」または Danger セクションにまとめ、赤系トーン＋ 2 段階確認（チェックボックスと入力）を義務付ける。
3. **監査 API フック**: すべての書き込み系 UI は `libs/audit` のフックを経由して `action`, `actorRole`, `apiRoute`, `runId`, `evidencePath` を送信する。未実装の場合はこのガイドに TODO を追加し、DOC_STATUS 備考でフォローアップする。
4. **ORCA タイムアウト**: `OrcaOrderPanel` は 5 秒でキャンセルし、`Retry` ボタンに `RUN_ID` と参照 Runbook（`ORCA_HTTP_404405_HANDBOOK.md`）をリンク。Timeout 超過時は自動で `audit.logOrcaTimeout` を送信する。
5. **データエクスポート**: `PatientDataExportPage` とスタンプエクスポートはファイル名に `RUN_ID` を含め (`patient-export-20251116T170500Z.csv`) 、`artifacts/` 側フォルダと operations ログへ同リンクを貼る。

## 3. レイアウト & アクセシビリティ要件

- **ReceptionPage**: VisitSidebar の API 呼び出し結果は `aria-live="polite"` で読み上げ、受付カード削除時は `role="status"` を持つ行に結果を表示する。詳細は `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` §4 を参照。
- **SystemPreferencesPage**: ライセンス/Cloud Zero カードは `SurfaceCard` の `tone="warning"` を用い、`aria-describedby` に RUN_ID と証跡パスを紐付ける。これにより Ops が監査対象を特定しやすくなる。
- **ChartsPage**: DocumentTimelinePanel の編集ダイアログは常に元文書タイトルを `aria-label` に含め、`PUT /karte/document` で失敗した場合でも焦点を失わないよう `focus-trap` を維持する。
- **PatientDataExportPage**: ダウンロードボタンには `data-audit-intent="export"` を付与し、スクリーンリーダー向けに「RUN_ID=... で出力」の説明を追加する。

## 4. 更新手順

1. UI 変更を行ったら `docs/web-client/architecture/REST_API_INVENTORY.md` の該当行で UI ステータスを更新し、本ガイドの表も同じ RUN_ID で修正する。
2. 監査フックや Danger UI に手を入れた場合は `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へステップを追記し、本ガイドからリンクする。
3. DOC_STATUS の Web クライアント行に RUN_ID / 証跡パス / 更新概要を残し、マネージャーチェックリスト（ORCA Sprint2 / Web Client Experience）へ同日反映する。

---

> 本ガイドは `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` の姉妹ドキュメントであり、Administration と Reception Page の監査要求に特化している。今後 API 実装範囲が広がった場合は、表へ行を追加し、関連する features/operations ドキュメントと同時に更新すること。
