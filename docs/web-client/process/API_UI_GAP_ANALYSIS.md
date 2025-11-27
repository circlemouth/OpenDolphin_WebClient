# 未整備 REST API 対応 UI 配置計画 (2026-05-27)

- 2026-05-27 (Codex): 調査結果を反映し、実装済み API の扱いと残課題を更新。
- 2025-11-16 (RUN_ID=20251116T170500Z, Worker-D): REST API インベントリと UI ロードマップを同期し、ページ名/ロール/フェーズの対応表と監査ログ方針を追記。

本資料では、`planning/WEB_VS_ONPRE_CHECKLIST.md` の REST API 比較表で未対応 (`×` または `△`) と判定されたエンドポイントに対し、Web クライアント上のどこに UI を配置し、どのフェーズで実装するかの方針を整理する。オンプレ（Swing）クライアントの画面構成との対応関係を明示し、実装時の責務分担と情報アーキテクチャを明確化することが目的である。

## 0. UI 配置サマリ（RUN_ID=20251116T170500Z）

| API グループ | 代表 API | ページ / コンポーネント | ロール | フェーズ | 補足 |
| --- | --- | --- | --- | --- | --- |
| ユーザー / 施設設定 | `/user*`, `/user/facility`, `/dolphin/*`, `/serverinfo/*` | [UserAdministrationPage](../../web-client/src/features/administration/pages/UserAdministrationPage.tsx) / [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) | SystemAdmin / Ops | 5（一部 6） | CRUD, ライセンス、Cloud Zero、Facility 情報を Administration グループへ集約し、監査ログは `docs/server-modernization/phase2/operations/logs/20251116T170500Z-orca-ui-sync.md` へリンク。 |
| 受付・来院・受付メモ | `/patient/pvt*`, `/pvt*`, `/pvt2*`, `/patient/documents/status` | [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) / [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) | Reception Clerk / Lead | 4 | 受付カード＋詳細ドロワで CRUD、Legacy API は VisitManagementDialog「詳細操作」タブに隔離。 |
| 患者データ出力・件数確認 | `/patient/all`, `/patient/custom/*`, `/patient/count/*` | [PatientDataExportPage](../../web-client/src/features/administration/pages/PatientDataExportPage.tsx) | SystemAdmin | 6 | エクスポート権限を Administration > Patient Export に限定し、監査は audit フック経由で送信。 |
| 予約・カルテ連動 | `/schedule/pvt*`, `/schedule/document`, `/appo` | [FacilitySchedulePage](../../web-client/src/features/schedule/pages/FacilitySchedulePage.tsx) | Reception Lead | 5 | 予約詳細ダイアログでカルテ生成/削除/一括更新。`RUN_ID=20251116T170500Z` の証跡を operations ログに保存。 |
| カルテ / 文書 / 請求 | `/karte/docinfo*`, `/karte/documents`, `/karte/document`, `/karte/diagnosis`, `/karte/observations`, `/karte/claim` | [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx)（DocumentTimelinePanel, DiagnosisPanel, ObservationPanel, ClaimAdjustmentPanel） | Physician / Billing | 5〜6 | ChartsPage 三カラム構成で完結。UI 変更時は `ux/ux-documentation-plan.md` と legacy 紐づき資料（`ux/legacy/CHART_UI_GUIDE_INDEX.md`）を同 RUN_ID で更新。 |
| ラボ・添付・証明書 | `/lab/module`, `/karte/attachment`, `/letter/*`, `/mml/*` | [LabResultsPanel](../../web-client/src/features/charts/components/LabResultsPanel.tsx) / [ImageViewerOverlay](../../web-client/src/features/charts/components/layout/ImageViewerOverlay.tsx) / [MedicalCertificatesPanel](../../web-client/src/features/charts/components/MedicalCertificatesPanel.tsx) | Physician / Lab | 5〜6 | ラボ結果と診断書 UI の監査要件を `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` に反映。 |
| スタンプ & ORCA セット | `/stamp/*`, `/orca/inputset`, `/orca/stamp` | [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) | Physician / Admin | 6 | 公開/購読/同期/削除を Administration グループに集約し、RUN_ID ごとのエビデンスを `artifacts/stamp-management/` に保存。 |
| ORCA マスター / 禁忌 | `/orca/tensu/*`, `/orca/disease/*`, `/orca/interaction`, `/orca/general` | [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) / [DiagnosisPanel](../../web-client/src/features/charts/components/DiagnosisPanel.tsx) | Physician | 4〜5 | カルテ右ペインで検索・禁忌チェックを提供。Timeout 対策は `useRestClient` でキャンセル制御。 |
| リアルタイム監視 / 監査 | `/chartEvent/*` | [AppShell](../../web-client/src/app/layout/AppShell.tsx) / [ReplayGapProvider](../../web-client/src/features/replay-gap/ReplayGapContext.tsx) | All | 4〜6 | SSE 監視と `chart-events.replay-gap` の監査ログ送出を共通化。UX 要件は `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` を参照。 |

> 上表を更新した場合は `docs/web-client/architecture/REST_API_INVENTORY.md`、`docs/web-client/README.md`、`docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` の該当節を同じ RUN_ID で同期すること。

## 1. 認証・システム管理系 API

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/user` CRUD / `/user/facility` / `/user/name` | 左カラムナビゲーションに新設した「Administration」グループ配下の `UserAdministrationPage`。SurfaceCard ベースの一覧＋詳細ドロワで CRUD を提供する。 | フェーズ5（完了済み） | 2026-05-24: `web-client/src/features/administration/pages/UserAdministrationPage.tsx` で実装済み。ロールガードは `AuthProvider`／`AppShell` で制御。残タスク: ユーザー一括登録 CSV の検討。 |
| `/serverinfo/*` | `SystemPreferencesPage` 内の「システム状態」タブとして配置し、ヘッダーの通知と連動するステータス表示を行う。 | フェーズ5（完了済み） | 2026-05-24: `useServerInfoSnapshot`・`SystemPreferencesPage` が `/serverinfo/jamri` などを取得して表示・監査記録を実装済み。 |
| `/dolphin` 系設定・ライセンス | 管理セクション配下の `SystemPreferencesPage` に「ライセンス」「Cloud Zero」「稼働状況」「施設管理者登録」カードを配置する。 | フェーズ5（完了済み） | 2026-06-01: `/dolphin/activity`・`/dolphin/license` に加え、`registerFacilityAdmin`（POST `/dolphin`）と施設情報更新フォームを実装。Cloud Zero 手動連携も維持。 |
| /20/adm/phr/* | SystemPreferencesPage の PHR 管理タブでキー管理・データ出力・テキスト取得を提供する。 | フェーズ6（完了済み） | 2026-06-01: PhrManagementPanel と phr-api.ts を追加し、キー生成・JSON ダウンロード・/20/adm/phr/medication 等のテキスト API を実装。 |
| /patient/all /patient/custom/* /patient/count/* | 「Administration > 患者データ出力」ページで CSV/JSON ダウンロードと件数チェックを提供する。 | フェーズ6（完了済み） | 2026-06-01: PatientDataExportPage.tsx と patient-export-api.ts を新設し、監査ログ付きで管理者が一括エクスポート可能にした。 |

## 2. 受付・予約周辺 API

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/patient/pvt/*` / `/patient/documents/status` | 既存 `ReceptionPage` のカードアクションに「詳細」ドロワを追加し、来院履歴・カルテ連携を右サイドの詳細ペインで表示。`AppShell` の右カラム（Sidebar）を利用して受付詳細を表示する。 | フェーズ4（完了済み） | `/patient/documents/status` はカルテ状態バッジとして表示。2026-05-24: `ReceptionVisitSidebar` を実装し、来院履歴と仮保存カルテ有無を提示。 |
| `/pvt/*` / `DELETE /pvt2/{pvtPK}` | `ReceptionPage` の各受付カードに「受付取消」および状態直接編集用のモーダルを追加。旧 API は互換目的で「詳細操作」タブに限定。 | フェーズ4（完了済み） | 2026-05-27: `VisitManagementDialog` に旧 API タブを実装し、`GET /pvt` 一覧表示・`POST /pvt` 登録・`PUT /pvt/memo` 更新を提供。既存の状態変更・取消機能と統合し、互換フローを Web から完結可能にした。 |
| `/schedule/document` / `DELETE /schedule/pvt` | `FacilitySchedulePage` の予約詳細ダイアログに「カルテ連動」セクションを追加して文書生成・解除を操作。 | フェーズ5（完了済み） | 予約カードから直接カルテ作成できる導線を提供。2026-05-25: 予約詳細ダイアログを実装し、カルテ生成（POST /schedule/document）と予約削除（DELETE /schedule/pvt）を提供。 |

## 3. カルテ・文書関連 API

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/karte/docinfo/*` / `/karte/modules/*` / `/karte/images/*` | `ChartsPage` 左カラムのカルテタイムラインにフィルタパネルを追加し、詳細情報は中央カラムのタイムライン項目をクリックした際のスライドオーバーで表示。 | フェーズ5（一部完了） | 2026-05-24: `DocumentTimelinePanel` で `/karte/docinfo` と `/karte/documents` を利用済み。`/karte/modules`・`/karte/images` の UI は未移植。 |
| `/karte/diagnosis` 系 CRUD | `ChartsPage` 右ペインに「病名管理」カードを追加。検索・登録は既存スタンプセクションから遷移するモーダルで行う。 | フェーズ5（完了済み） | 2026-05-24: `DiagnosisPanel` と `useDiagnosisMutations` で `/karte/diagnosis` の CRUD を提供。 |
| `/karte/observations` / `/karte/claim` / `/karte/moduleSearch` | `ChartsPage` の中央カラムにタブを追加し、「観察記録」「請求調整」を切り替えられるようにする。`SurfaceCard` + `DataGrid` を使用。 | フェーズ6（完了済み） | 2026-05-27: 既存の `ObservationPanel` に加え、`ClaimAdjustmentPanel` を新設。`/karte/moduleSearch` でモジュール検索し、`PUT /karte/claim` により CLAIM 再送信を提供。操作ログとバリデーションを React Query 経由で実装。 |
| `PUT /karte/document` | 既存カルテタイムラインの各ノートカードに「編集」アクションを追加し、エディタをモーダルで再利用。保存時に `PUT` を呼び出しつつバージョン履歴を保持。 | フェーズ5（完了済み） | 2026-05-27: `DocumentTimelinePanel` に編集ボタンを追加し、`ChartsPage` の進行記録コンポーザから既存文書を読み込み・上書きできるようにした。`updateDocument` API を通じて `PUT /karte/document` を呼び出し、CLAIM 判定やモジュール再構成も行う。 |

## 4. テンプレート・スタンプ管理

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/stamp/tree` 更新系 / `/stamp/published/*` / `/stamp/subscribed/*` / `/stamp/list` | `ChartsPage` 補助パネルに「スタンプ管理センター」タブを追加し、左カラムでフォルダツリー、中央でスタンプ詳細、右カラムで共有設定を表示。 | フェーズ6 | ドラッグ＆ドロップとバージョン履歴を実装。公開/購読操作はアクセシビリティ対応のダイアログで提供。 |

## 5. ORCA・MML 連携

| 対象 API | 想定 UI / 配置 | 実装フェーズ | 備考 |
| --- | --- | --- | --- |
| `/orca/facilitycode` / `/orca/deptinfo` / `/orca/inputset` | 管理セクションの `SystemPreferencesPage` に「ORCA 連携」タブを追加し、施設コードや診療科情報を設定。 | フェーズ5 | 既存 ORCA 設定ファイルと同期する移行スクリプトを同梱。 |
| `/orca/tensu/shinku` / `/orca/tensu/code` / `/orca/disease/import` / `/orca/disease/active` | `OrcaOrderPanel` に「詳細マスター」ドロップダウンを追加し、検索絞り込みから呼び出す。 | フェーズ4 | キャッシュ戦略（localStorage 禁止）を HTTP クライアントに設定。 |
| `/mml` 系 | `ChartsPage` のカルテタイムラインヘッダに「MML エクスポート」ボタンを追加し、エクスポート設定モーダルで選択項目とフォーマットを指定。 | フェーズ6 | Zip ダウンロード完了後に監査ログを送出。 |

**Web クライアント差分（RUN_ID=20251123T135709Z、対応状況: MSW/設計済み、UI実装中）**: ORCA-04 `/orca/tensu/ten` は API 提供済みだが OrcaOrderPanel に点数帯フィルタ UI が未実装。Phase5 backlog とし、実装時は `docs/server-modernization/phase2/operations/logs/20251123T135709Z-orca-master-gap.md` と `notes/MODERNIZED_SERVER_GAP_TRACKER_20251116T210500Z.md` の ORCA-04/05〜07 連携を参照する。  
**OrcaOrderPanel 点数帯フィルタ実装方針メモ（RUN_ID=20251123T135709Z）**:  
- 目的: `/orca/tensu/ten/{param}/` により点数値（ten）の範囲検索を行い、処置・薬剤のコスト帯で絞り込む。`param` は `min-max` 形式（例: `50-150`）または単一値（例: `200`）。第2要素に `yyyymmdd` を付与すると評価日を上書きできる（サーバー側 `defaultNow()` で当日補完）。
- 画面配置: OrcaOrderPanel の「詳細フィルタ」セクションに数値レンジスライダー + ダブル入力ボックスを追加。デフォルトは `0–300` 点、ショートカットボタン（50以下・50–100・100–300・300以上）を用意し、選択時に下限/上限を自動入力。結果は既存の名称/コード検索結果と同じリストを再利用し、検索条件バッジとして「点数帯: 50–100 点」「評価日: YYYY/MM/DD」を表示。
- 必要データ（レスポンス項目）: `srycd`（点数コード）、`name/kananame/taniname`（表示名称）、`ten`（点数）、`tensikibetu`（種別: 医科/歯科等）、`nyugaitekkbn`（入外区分）、`routekkbn`（院内/院外）、`srysyukbn`（診療種別）、`hospsrykbn`（入院区分）、`ykzkbn`（薬剤区分）、`yakkakjncd`（薬価基準コード）、`yukostymd`/`yukoedymd`（有効期間）。表示には name + ten + 種別バッジを使用し、ソートは `ten` 昇順で実装。
- クエリ組み立て案: `min`/`max` の両方入力時は `min-max`、片側のみ時は単一値として送信。評価日を指定した場合は `"${min}-${max},${yyyymmdd}"` 形式で連結し、空欄時は当日と同等。入力バリデーションは 0–9999 の整数（小数は切り捨て）で、min > max の場合は UI でエラーバッジを出しリクエスト送信を抑止。
- 既存型/MSW との結線: `web-client/src/types/orca.ts` の `TensuMaster` 系定義（`srycd/name/ten/...`）をそのまま利用し、検索 hook を `features/charts/api/orca-api.ts` に `fetchTensuByTen(param: string)` として追加する想定。MSW では既存の `/orca/tensu/name` 用フィクスチャを流用し、`ten` でフィルタしたリストを返すダミーハンドラを追加するだけで UI 実装をデバッグ可能（本タスクではハンドラ追加は行わない）。
- 依存 API / UI 結合: 点数値検索結果を OrcaOrderPanel のスタンプ生成フロー（`createOrderStamp`）へ渡すため、既存の名称/コード検索と同じ `OrcaSearchResult` 型にマッピングする。禁忌チェック（`PUT /orca/interaction`）に渡す際は `srycd` と `ykzkbn` を使用するため、レスポンスから同値を保持する。キャッシュは React Query で `['orca','tensu','ten',min,max,effectiveDate]` キーを採用し、名称検索とは別キーでキャッシュ汚染を防ぐ。
**MSW実装済み（RUN_ID=20251123T135709Z）**: `/orca/master/{address,etensu,generic-class,generic-price,hokenja,kensa-sort,material,youhou}` の MSW フィクスチャ/ハンドラを追加（`web-client/src/mocks/fixtures/orcaMaster.ts`, `web-client/src/mocks/handlers/orcaMasterHandlers.ts`, `handlers/index.ts` へ合流）。型は `src/types/orca.ts` にリストレスポンス共通ラッパーと各エントリを追加。`cd web-client && npm run lint -- --max-warnings=0 --no-cache` でエラー 0 を確認（SSE ReplayGap 既存キャッシュ警告を解消）。UI 側は ORCA-04 の点数帯フィルタ実装を進行中で、MSW 返却を利用しながら OrcaOrderPanel へ組み込む予定（本タスクでは UI 未完）。

## 6. 実装上の共通指針

1. **ナビゲーション構造**: 管理者向け機能は左カラムナビの新グループ「Administration」に集約し、一般ユーザーには表示しない。受付・カルテ関連は既存ページへカード／タブ追加で統合する。
2. **ロールベースアクセス制御**: `/user` や `/dolphin` などセンシティブな操作は `useAuth()` の権限スコープでガードし、Unauthorized 状態を UI で明示する。
3. **監査ログ・エラーハンドリング**: 新規 UI から呼び出す API すべてに `libs/audit` のフックを追加し、操作ログ・エラー通知を既存ポリシーに合わせる。
4. **並行運用**: Swing クライアントと同時利用する期間は、旧 API（`/pvt` など）を「詳細操作」タブに隔離し、誤操作防止の警告を表示する。
5. **ドキュメント連携**: 実装完了時には `planning/WEB_VS_ONPRE_CHECKLIST.md` の該当行を更新し、UI スクリーンショットを `docs/web-client/ux` 配下に保存する。

この計画はフェーズ5以降のスプリント計画に統合し、進捗に応じて四半期ごとに見直すこと。




