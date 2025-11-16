# REST APIインベントリ（Webクライアント向け）

- 作成日: 2025-10-29
- 参照元: `server/src/main/java/open/dolphin/rest`, `server/src/main/java/open/orca/rest`, `docs/web-client/requirements/WEB_CLIENT_REQUIREMENTS.md` 第14章
- 前提: すべてのリクエストで `userName` / `password(MD5)` / `clientUUID` ヘッダーを送出し、施設IDは WildFly の `RemoteUser` またはボディで補完する。
- ステータス凡例: ✅=利用可、🛠=実装時調整あり、⚠=追加検証が必須、🚫=Webクライアント非対応。
- UIステータス欄では RUN_ID=`20251116T170500Z`（Worker-D）時点の状況を「実装済 / 実装予定 / 非対応」で整理し、参照先 UI や担当ロール・フェーズを明記する。
- 旧サーバー REST API の完全な一覧は [`../../server/LEGACY_REST_API_INVENTORY.md`](../../server/LEGACY_REST_API_INVENTORY.md) を参照。

## 1. 認証・ユーザー管理 (`UserResource`, `SystemResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | UIステータス (RUN_ID=20251116T170500Z) |
| --- | --- | --- | --- | --- | --- |
| UserResource | GET | `/user/{userId}` | ログイン後のユーザー/施設情報取得 | ✅ フェーズ1で必須 | 実装済: [AppShell](../../web-client/src/app/layout/AppShell.tsx) 初期ロードで `useAuth` が呼び出し、全ロール共通でフェーズ1から利用。 |
| UserResource | GET | `/user` | 施設内ユーザー一覧 | 🛠 管理者向け画面で利用予定 | 実装済: [UserAdministrationPage](../../web-client/src/features/administration/pages/UserAdministrationPage.tsx)（Administration グループ）で SystemAdmin がフェーズ5に導入。 |
| UserResource | PUT | `/user` | プロファイル更新 | 🛠 自分自身のプロファイル編集で使用 | 実装済: [UserAdministrationPage](../../web-client/src/features/administration/pages/UserAdministrationPage.tsx) とユーザーメニューの設定ドロワから更新（SystemAdmin/一般ユーザー共通, Phase5）。 |
| UserResource | POST | `/user` | ユーザー作成 | ⚠ Web管理画面の要否未決 | 実装済: [UserAdministrationPage](../../web-client/src/features/administration/pages/UserAdministrationPage.tsx) の「新規ユーザー」フローで SystemAdmin が利用 (Phase5 完了)。 |
| UserResource | DELETE | `/user/{userId}` | ユーザー削除 | ⚠ 当面は既存コンソールに委譲 | 実装予定: [UserAdministrationPage](../../web-client/src/features/administration/pages/UserAdministrationPage.tsx) Danger 操作を Phase6 backlog とし、SystemAdmin のみ表示。 |
| UserResource | GET | `/user/name/{userId}` | ユーザー表示名取得 | ✅ 各種一覧の表示補助に利用可 | 実装済: [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) / [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) のヘッダ表示で利用。ロール=全員, Phase4。 |
| UserResource | PUT | `/user/facility` | 施設情報更新 | ⚠ 運用導入初期のみ使用想定 | 実装済: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx)「施設設定」タブで Ops/Admin が Phase5 から利用。 |
| SystemResource | GET | `/dolphin/activity/{param}` | サーバー活動ログ取得 | ⚠ 監査ログUIの要否検討 | 実装予定: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) に「監査ログ」カードを追加（Phase6, Ops Admin）。 |
| SystemResource | POST | `/dolphin` | 施設管理者アカウント登録 | ⚠ 運用チーム専用 | 実装予定: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) の Facility 管理セクション（Phase6, Ops Admin）。 |
| SystemResource | POST | `/dolphin/license` | CloudZero ライセンス登録/検証 | 🛠 システム設定画面で参照 | 実装済: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) 「Cloud Zero」タブで Ops Admin が Phase5 から実行。 |
| SystemResource | GET | `/dolphin/cloudzero/sendmail` | 月次 CloudZero メール送信 | ⚠ バッチ代替導線の検討 | 実装予定: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) に手動トリガ（Phase6, Ops Admin, 要 RUN 手順）。 |
| ServerInfoResource | GET | `/serverinfo/*` | サーバー設定取得 | ✅ 初期設定画面で参照 | 実装済: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) 「システム状態」タブで Ops Admin が Phase5 から監視。 |

## 2. 患者・受付 (`PatientResource`, `PVTResource`, `ScheduleResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | UIステータス (RUN_ID=20251116T170500Z) |
| --- | --- | --- | --- | --- | --- |
| PatientResource | GET | `/patient/name/{name}` | 漢字氏名検索 | ✅ 患者検索UI基本機能 | 実装済: [PatientsPage](../../web-client/src/features/patients/pages/PatientsPage.tsx) 検索タブで受付担当 (Phase4)。 |
| PatientResource | GET | `/patient/kana/{kana}` | カナ検索 | ✅ 検索タブで使用 | 実装済: [PatientsPage](../../web-client/src/features/patients/pages/PatientsPage.tsx) カナタブ (Phase4, Reception)。 |
| PatientResource | GET | `/patient/digit/{digit}` | 生年月日/電話番号等の数字検索 | ✅ ショートカット検索に利用 | 実装済: [PatientsPage](../../web-client/src/features/patients/pages/PatientsPage.tsx) クイックサーチ (Phase4, Reception)。 |
| PatientResource | GET | `/patient/id/{pid}` | 患者ID直接取得 | ✅ 詳細画面遷移 | 実装済: [PatientsPage](../../web-client/src/features/patients/pages/PatientsPage.tsx) および [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) からカルテ/受付へ遷移 (Phase4, Reception)。 |
| PatientResource | GET | `/patient/pvt/{yyyymmdd}` | 日次来院者取得 | 🛠 受付リスト表示 | 実装済: [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) の来院一覧 (Phase4, Reception Clerk)。 |
| PatientResource | GET | `/patient/documents/status` | 仮保存カルテの患者一覧 | ✅ 下書き管理に活用 | 実装済: [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) VisitSidebar で下書きバッジ表示 (Phase4, Reception/MedicalRecords)。 |
| PatientResource | POST/PUT | `/patient` | 新規患者登録/更新 | ✅ Web 編集フォーム経由で実装済み | 実装済: [PatientsPage](../../web-client/src/features/patients/pages/PatientsPage.tsx) 編集フォーム (Phase4, Reception)。 |
| PatientResource | GET | `/patient/count/{name}` | 検索件数確認 | 🛠 UX最適化用 | 実装予定: [PatientsPage](../../web-client/src/features/patients/pages/PatientsPage.tsx) の 1000 件超警告 (Phase6 backlog, Reception)。 |
| PatientResource | GET | `/patient/all` | 全患者リスト取得 | ⚠ 大量データの扱いを検討 | 実装済: [PatientDataExportPage](../../web-client/src/features/administration/pages/PatientDataExportPage.tsx) 管理者向け一括エクスポート (Phase6, SystemAdmin)。 |
| PatientResource | GET | `/patient/custom/{param}` | カスタム検索 | ⚠ 要件ヒアリング中 | 実装済: [PatientDataExportPage](../../web-client/src/features/administration/pages/PatientDataExportPage.tsx) の条件フィルタ (Phase6, SystemAdmin)。 |
| PVTResource | GET | `/pvt/{param}` | 受付リスト/状態取得 | ✅ 受付リスト初期表示 | 実装済: [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) のカード一覧 (Phase4, Reception)。 |
| PVTResource | POST | `/pvt` | 受付登録 | ✅ 受付ダイアログから利用 | 実装済: [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) Legacy タブ (Phase4, Reception)。 |
| PVTResource | PUT | `/pvt/{param}` | 受付状態更新 | ✅ 診察開始/終了のトグル | 実装済: [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) ステータス操作 (Phase4, Reception)。 |
| PVTResource | PUT | `/pvt/memo/{param}` | 受付メモ更新 | 🛠 受付UIから利用 | 実装済: [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) メモタブ (Phase4, Reception)。 |
| PVTResource | DELETE | `/pvt/{pvtPK}` | 受付削除 | ⚠ 監査要件確認後に UI 解放 | 実装済: [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) Danger 操作 (Phase4, Reception Lead, 監査ログ必須)。 |
| PVTResource2 | POST | `/pvt2` | 受付登録（拡張版） | ✅ VisitManagementDialog で利用 | 実装済: [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) 標準タブ (Phase4, Reception)。 |
| PVTResource2 | DELETE | `/pvt2/{pvtPK}` | 受付削除 | ⚠ 担当者のみ操作 | 実装済: [VisitManagementDialog](../../web-client/src/features/reception/components/VisitManagementDialog.tsx) Danger 操作 (Phase4, Reception Lead)。 |
| PVTResource2 | GET | `/pvt2/pvtList` | ロングポーリング用受付一覧 | ✅ ChartsPage のステータス更新 | 実装済: [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) + [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) のロングポーリング (Phase4, Reception/Physician)。 |
| ScheduleResource | GET | `/schedule/pvt/{param}` | 予約/受付一覧取得 | 🛠 カレンダーと連携 | 実装済: [FacilitySchedulePage](../../web-client/src/features/schedule/pages/FacilitySchedulePage.tsx) と Reception 予約タブ (Phase5, Reception Lead)。 |
| ScheduleResource | POST | `/schedule/document` | 診療履歴作成（予約経由） | ⚠ 旧クライアント依存ロジック | 実装済: [FacilitySchedulePage](../../web-client/src/features/schedule/pages/FacilitySchedulePage.tsx) 予約詳細ダイアログ (Phase5, Reception Lead)。 |
| ScheduleResource | DELETE | `/schedule/pvt/{param}` | 予約削除 | ⚠ 予約管理UI要件次第 | 実装済: [FacilitySchedulePage](../../web-client/src/features/schedule/pages/FacilitySchedulePage.tsx) 予約詳細ダイアログ (Phase5, Reception Lead)。 |
| AppoResource | PUT | `/appo` | 予約一括更新 | ⚠ 運用設計が未確定 | 実装済: [FacilitySchedulePage](../../web-client/src/features/schedule/pages/FacilitySchedulePage.tsx) の一括更新フロー (Phase5, Reception Lead)。 |

## 3. カルテ主機能 (`KarteResource`, `AppoResource`, `LetterResource`, `MmlResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | UIステータス (RUN_ID=20251116T170500Z) |
| --- | --- | --- | --- | --- | --- |
| KarteResource | GET | `/karte/pid/{pid,from}` | 患者IDベースでカルテ取得 | ✅ カルテ画面初期ロード | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) 初期ロード (Phase4, Physician)。 |
| KarteResource | GET | `/karte/{patientPk,from}` | PKベースカルテ取得 | 🛠 内部再読み込み用 | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) で再読込に利用 (Phase4, Physician)。 |
| KarteResource | GET | `/karte/docinfo/{karteId,from,includeModified}` | 文書メタ一覧取得 | ✅ タイムライン表示 | 実装済: [DocumentTimelinePanel](../../web-client/src/features/charts/components/DocumentTimelinePanel.tsx) (Phase5, Physician)。 |
| KarteResource | GET | `/karte/documents/{docIds}` | 文書詳細取得 | ✅ 画面表示 | 実装済: [DocumentTimelinePanel](../../web-client/src/features/charts/components/DocumentTimelinePanel.tsx) 詳細ペイン (Phase5, Physician)。 |
| KarteResource | POST | `/karte/document` | カルテ保存 | ✅ フェーズ2の中心機能 | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) ProgressNoteComposer (Phase4, Physician)。 |
| KarteResource | POST | `/karte/document/pvt/{pvtPK,state}` | 受付紐付け保存 | ✅ 受付完結フローで使用 | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) 保存時と [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) 受付完結フロー (Phase4, Physician/Reception)。 |
| KarteResource | PUT | `/karte/document` | カルテ更新 | 🛠 既存クライアント互換 | 実装済: [DocumentTimelinePanel](../../web-client/src/features/charts/components/DocumentTimelinePanel.tsx) 編集モーダル (Phase5, Physician)。 |
| KarteResource | GET | `/karte/claim` | CLAIM送信トリガー | ⚠ 自費対応検証後 | 実装済: [ClaimAdjustmentPanel](../../web-client/src/features/charts/components/ClaimAdjustmentPanel.tsx) (Phase6, Billing/Physician)。 |
| KarteResource | GET | `/karte/diagnosis/{param}` | 病名取得・更新 | ✅ A/P と連携 | 実装済: [DiagnosisPanel](../../web-client/src/features/charts/components/DiagnosisPanel.tsx) (Phase5, Physician)。 |
| KarteResource | GET | `/karte/observations/{param}` | 観察値取得 | 🛠 バイタル表示に活用 | 実装済: [ObservationPanel](../../web-client/src/features/charts/components/ObservationPanel.tsx) (Phase6, Physician/Nurse)。 |
| KarteResource | GET | `/karte/attachment/{docId}` | 添付取得 | 🛠 画像/ファイルプレビュー | 実装予定: [ImageViewerOverlay](../../web-client/src/features/charts/components/layout/ImageViewerOverlay.tsx) で Phase6 ズーム表示と監査を追加。 |
| KarteResource | GET | `/karte/moduleSearch/{query}` | モジュール検索 | ⚠ UI要件ヒアリング中 | 実装済: [ClaimAdjustmentPanel](../../web-client/src/features/charts/components/ClaimAdjustmentPanel.tsx) / スタンプモジュール検索 (Phase6, Physician)。 |
| KarteResource | GET | `/karte/docinfo/all/{param}` | 全文書取得 | 🚫 レガシー互換のみ | 非対応: 応答サイズが大きいため Web UI からは呼び出さず、Legacy 互換用途のみに限定。 |
| NLabResource | GET | `/lab/module/{pid,first,max}` | ラボ結果取得 | ✅ ラボビューの基礎データ | 実装済: [LabResultsPanel](../../web-client/src/features/charts/components/LabResultsPanel.tsx) (Phase5, Physician)。 |
| AppoResource | PUT | `/appo` | 予約一括更新 | ⚠ UI への露出検討中 | 実装済: [FacilitySchedulePage](../../web-client/src/features/schedule/pages/FacilitySchedulePage.tsx) 予約バルク更新 (Phase5, Reception Lead)。 |
| LetterResource | GET | `/letter/{param}` | 紹介状など文書取得 | 🛠 文書出力機能で使用 | 実装済: [MedicalCertificatesPanel](../../web-client/src/features/charts/components/MedicalCertificatesPanel.tsx) / [SchemaEditorPanel](../../web-client/src/features/charts/components/SchemaEditorPanel.tsx) (Phase6, Physician/Clerk)。 |
| MmlResource | GET | `/mml/{param}` | MML文書出力 | ⚠ 互換性検証中 | 実装予定: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) Export ボタンで Phase6 に MML エクスポート導線を追加。 |

## 4. リアルタイム・ロングポーリング (`ChartEventResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | UIステータス (RUN_ID=20251116T170500Z) |
| --- | --- | --- | --- | --- | --- |
| ChartEventResource | GET | `/chartEvent/subscribe` | 長輪講サブスクライブ | ✅ 既存ロングポーリングの再利用 | 実装済: [AppShell](../../web-client/src/app/layout/AppShell.tsx) / [ReceptionPage](../../web-client/src/features/reception/pages/ReceptionPage.tsx) / [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) が SSE を購読 (Phase4, 全ロール)。 |
| ChartEventResource | PUT | `/chartEvent/event` | イベント送信 | ✅ カルテ更新通知 | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) 保存・受付完結時に publish (Phase4, Physician/Reception)。 |
| ChartEventResource | GET | `/chartEvent/dispatch` | イベントディスパッチ | ⚠ 使われていない可能性 | 実装予定: [ReplayGapProvider](../../web-client/src/features/replay-gap/ReplayGapContext.tsx) を Phase6 で拡張し、`chart-events.replay-gap` ディスパッチを監査付きで扱う。 |

## 5. スタンプ・テンプレート (`StampResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | UIステータス (RUN_ID=20251116T170500Z) |
| --- | --- | --- | --- | --- | --- |
| StampResource | GET | `/stamp/tree/{userPK}` | 個人スタンプツリー取得 | ✅ ワークスペースで使用 | 実装済: [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) と [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) スタンプパネル (Phase6, Physician/Admin)。 |
| StampResource | POST | `/stamp/tree` | スタンプツリー更新 | ✅ フロントのスタンプ編集で利用 | 実装済: [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) (Phase6, Physician/Admin)。 |
| StampResource | POST | `/stamp/tree/sync` | ツリー同期 | 🛠 既存クライアント互換API | 実装予定: [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) のフェーズ6タスク。 |
| StampResource | GET | `/stamp/published/tree` | 公開スタンプ取得 | ✅ 共通スタンプに利用 | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) スタンプパネル (Phase5, Physician)。 |
| StampResource | GET | `/stamp/list/{entity}` | スタンプリスト取得 | ✅ スタンプ検索 | 実装済: [ChartsPage](../../web-client/src/features/charts/pages/ChartsPage.tsx) スタンプ検索, [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) (Phase5, Physician/Admin)。 |
| StampResource | POST | `/stamp/list` | スタンプリスト登録 | ⚠ 権限設計次第 | 実装予定: [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) 公開スタンプ登録 (Phase6, SystemAdmin)。 |
| StampResource | DELETE | `/stamp/id/{uuid}` | スタンプ削除 | ⚠ 権限と監査ログ要件を整理 | 実装予定: [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) Danger 操作 (Phase6, SystemAdmin)。 |

## 6. ORCA 連携 (`OrcaResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | UIステータス (RUN_ID=20251116T170500Z) |
| --- | --- | --- | --- | --- | --- |
| OrcaResource | GET | `/orca/facilitycode` | 施設コード取得 | 🛠 ORCA接続テスト | 実装済: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) ORCA 設定タブ (Phase5, Ops Admin)。 |
| OrcaResource | GET | `/orca/tensu/name/{query}/` | 点数マスター（名称検索） | ✅ オーダ検索の基本 | 実装済: [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) (Phase4, Physician)。 |
| OrcaResource | GET | `/orca/tensu/code/{query}/` | 点数コード検索 | ✅ コード直接入力 | 実装済: [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) (Phase4, Physician)。 |
| OrcaResource | GET | `/orca/tensu/ten/{param}/` | 点数値検索 | 🛠 コストフィルタリング | 実装予定: [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) 詳細フィルタ (Phase5 backlog, Physician/Billing)。 |
| OrcaResource | GET | `/orca/disease/name/{param}/` | 病名マスター検索 | ✅ 病名入力支援 | 実装済: [DiagnosisPanel](../../web-client/src/features/charts/components/DiagnosisPanel.tsx) ORCA 検索 (Phase5, Physician)。 |
| OrcaResource | GET | `/orca/disease/import/{param}` | ORCA病名履歴取得 | 🛠 病名参照 | 実装予定: [DiagnosisPanel](../../web-client/src/features/charts/components/DiagnosisPanel.tsx) 既往履歴タブ (Phase6, Physician)。 |
| OrcaResource | GET | `/orca/disease/active/{param}` | 現在病名取得 | ✅ 初期病名同期 | 実装済: [DiagnosisPanel](../../web-client/src/features/charts/components/DiagnosisPanel.tsx) 初期化フック (Phase5, Physician)。 |
| OrcaResource | PUT | `/orca/interaction` | 併用禁忌チェック | ✅ 処方チェック | 実装済: [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) 禁忌チェック (Phase4, Physician)。 |
| OrcaResource | GET | `/orca/general/{srycd}` | 一般名取得 | ✅ 処方パネル補助 | 実装済: [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) (Phase4, Physician)。 |
| OrcaResource | GET | `/orca/inputset` | ORCA入力セット一覧 | ✅ スタンプセット生成 | 実装済: [OrcaOrderPanel](../../web-client/src/features/charts/components/OrcaOrderPanel.tsx) / [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) (Phase5, Physician/Admin)。 |
| OrcaResource | GET | `/orca/stamp/{param}` | 入力セット展開 | ✅ ORCAセット→スタンプ化 | 実装済: [StampManagementPage](../../web-client/src/features/administration/pages/StampManagementPage.tsx) (Phase5, Physician/Admin)。 |
| OrcaResource | GET | `/orca/deptinfo` | 診療科情報取得 | 🛠 初期設定UIで参照 | 実装済: [SystemPreferencesPage](../../web-client/src/features/administration/pages/SystemPreferencesPage.tsx) ORCA 設定タブ (Phase5, Ops Admin) — 追加検証は継続。 |

## 7. 長寿命トピック & 調査課題

- `/karte/moduleSearch/{query}` と `/stamp/tree/sync` は旧クライアント向け設計が色濃いため、Phase6 で UI/権限を再検証する。
- `/schedule/document` などスケジュール関連の書き込み系 API は運用フローの承認を得てから UI に取り込む。RUN_ID=`20251116T170500Z` では Reception Lead 向けの予約ダイアログに限定公開。
- ORCA 呼び出し系はタイムアウトが 5秒を超えるケースがあり、リトライとキャンセル制御を HTTP クライアントレイヤで標準化する。`useRestClient` に共通の Abort 制御を追加予定。
- 今後 API バージョニングや GraphQL 化など拡張が必要になった場合は、本インベントリをベースに変更履歴を管理する。
