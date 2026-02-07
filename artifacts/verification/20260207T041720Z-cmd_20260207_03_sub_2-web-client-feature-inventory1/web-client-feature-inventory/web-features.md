# Web Client Feature Inventory（根拠付き）

- RUN_ID: 20260207T041720Z-cmd_20260207_03_sub_2-web-client-feature-inventory1
- 目的: 旧来版（Swing）突合用に、Web側の主要機能を「根拠付き」で一覧化する。
- スコープ: web-client（Login / Reception / Charts / Patients / Administration + Print + Debug）
- 根拠の優先順位: (1) `docs/web-client/architecture/*` (2) `docs/verification-plan.md` / `docs/weborca-reception-checklist.md` (3) `web-client/src/*`

## ルーティング/ナビ（画面一覧）

- 主要画面ルート: `/f/:facilityId/reception`, `/f/:facilityId/charts`, `/f/:facilityId/patients`, `/f/:facilityId/administration`（system_admin）(根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-screen-review-template.md`)
- 印刷ルート: `/f/:facilityId/charts/print/outpatient`, `/f/:facilityId/charts/print/document` (根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-screen-review-template.md`)
- Debug ルート（本番ナビ外）: `/f/:facilityId/debug`, `/f/:facilityId/debug/outpatient-mock`, `/f/:facilityId/debug/orca-api`, `/f/:facilityId/debug/legacy-rest`（ENV+role gate）(根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`)
- ログイン/施設境界: `/login`, `/f/:facilityId/login`, facilityId 不一致は拒否、未ログインは `/login` へリダイレクト (根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-navigation-hardening-prerequisites-20260119.md`)

## Login（認証/セッション）

- Login 画面（施設/ユーザー/パスワード/UUID入力、成功で facility 配下へ遷移、RUN_ID を保持）(根拠: `web-client/src/LoginScreen.tsx`; `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-screen-review-template.md`)
- セッション永続化（sessionStorage/一部localStorageフォールバック、ログアウトでクリア、資格情報の掃除）(根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-navigation-hardening-prerequisites-20260119.md`)
- セッション失効イベントでログアウト（失効通知の購読）(根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-navigation-hardening-prerequisites-20260119.md`)
- 施設/ユーザー切替（ログアウトを伴うrole-switch監査ログ）(根拠: `web-client/src/AppRouter.tsx`)

## Reception（受付）

- 当日受付フローの成立確認（外来関連は `/orca21/medicalmodv2/outpatient` + `/orca/appointments/list` + `/orca/visits/list` へ一本化、`/orca/claim/outpatient` は呼ばない）(根拠: `docs/verification-plan.md`; `docs/weborca-reception-checklist.md`)
- 受付一覧の統合表示（予約/受付/会計/状態を俯瞰、ステータス別セクション、折りたたみ、右ペイン同期）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `web-client/src/features/reception/pages/ReceptionPage.tsx`)
- 検索/フィルタ（日時、キーワード、診療科、担当医、保険/自費、ソート）+ 保存ビュー（適用/削除/保存、Patients と共有）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `docs/web-client/architecture/web-client-screen-review-template.md`)
- 予約外当日受付（受付登録/取消）フォーム（必須入力ガード、一覧選択から patientId/receptionId 転記、結果表示）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `web-client/src/features/reception/pages/ReceptionPage.tsx`)
- 受付送信（`/orca/visits/mutation`）結果の Tone 表示（成功/警告/失敗、Api_Result/詳細/所要時間）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `docs/weborca-reception-checklist.md`)
- ORCA queue の可視化と例外抽出（未承認/送信エラー/遅延、`/api/orca/queue` を一次情報として使用）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `docs/verification-plan.md`)
- 自動更新（90s）と stale 警告（180s）+ 選択保持（一覧更新でも選択中の行を守る）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`)
- 監査ビュー（local audit log の検索/表示、最新 auditEvent のサマリ表示）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`)
- Charts への遷移（ダブルクリック/Enter/ボタンで新規タブ、RUN_ID/patientId 等を carry）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`)
- マスタ/トーン復旧コンソール（missingMaster/cacheHit/dataSourceTransition 等の可視化と切替、復旧導線）(根拠: `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`; `docs/verification-plan.md`)

## Charts（カルテ）

- 3カラム + Utility Drawer 構成（患者サマリバー固定、左=患者/病名、中央=SOAP/タイムライン、右=ORCA要約/原本/記録）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `web-client/src/features/charts/pages/ChartsPage.tsx`)
- アクションバー（診療終了/ORCA送信/ドラフト保存/印刷、できない時は理由と次アクションを表示）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `web-client/src/features/charts/ChartsActionBar.tsx`)
- SOAP入力（S/O/A/P/自由記載、テンプレ挿入、症状詳記タブ、入力途中のドラフト運用）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `web-client/src/features/charts/SoapNotePanel.tsx`)
- SOAP履歴/タイムライン（DocumentTimeline: 受付履歴/請求/ORCAキュー/PUSH通知を時系列表示、異常時の復旧導線）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `web-client/src/features/charts/DocumentTimeline.tsx`)
- 病名編集（CRUD + ORCA disease API 同期）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `web-client/src/features/charts/DiagnosisEditPanel.tsx`)
- オーダー編集（処方=medOrder、一般/処置/材料等=generalOrder、`/orca/order/bundles` を基盤に保存/参照）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `docs/verification-plan.md`; `web-client/src/features/charts/OrderBundleEditPanel.tsx`)
- 処置オーダー送信（器材/薬品使用量の数量/コードを `/api21/medicalmodv2` XMLへ反映）(根拠: `docs/verification-plan.md`; `web-client/src/features/charts/ChartsActionBar.tsx`)
- 文書作成/編集（紹介状等、`/odletter/letter` を利用、オーダー欄の文書項目モーダル表示）(根拠: `docs/verification-plan.md`; `web-client/src/features/charts/DocumentCreatePanel.tsx`)
- 文書印刷プレビュー（charts-document-print-dialog、`/f/:facilityId/charts/print/document`）(根拠: `web-client/src/features/charts/pages/ChartsDocumentPrintPage.tsx`; `docs/verification-plan.md`)
- 外来印刷プレビュー（`/f/:facilityId/charts/print/outpatient`）(根拠: `web-client/src/features/charts/pages/ChartsOutpatientPrintPage.tsx`; `docs/web-client/architecture/web-client-screen-review-template.md`)
- ORCA要約/原本（要約パネル + XML原本の可視化、マスタ欠損/ガードの見える化）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `docs/verification-plan.md`)
- ORCAキュー再送導線（`/api/orca/queue?patientId=...&retry=1` を利用）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`; `docs/verification-plan.md`)
- SSE（ChartEventStream）で更新通知（ストリーム未提供時は停止する方針）(根拠: `docs/verification-plan.md`; `web-client/src/features/shared/ChartEventStreamBridge.tsx`)
- キーボードショートカット（送信/印刷/診療終了/ドラフト保存、Utility Drawer、セクション移動）(根拠: `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`)

## Patients（患者検索/一覧/編集）

- 患者検索/一覧（キーワード、診療科、担当医、保険/自費、保存ビュー、Reception からフィルタ引継ぎ）(根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`; `web-client/src/features/patients/PatientsPage.tsx`)
- 患者基本情報の作成/更新/削除（バリデーション、失敗時の復旧導線）(根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`; `web-client/src/features/patients/api.ts`)
- ORCA原本参照（patientgetv2 の XML/JSON 切替表示）(根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`; `web-client/src/features/patients/patientOriginalApi.ts`)
- 保険者検索（insuranceinf1v2）と保険欄への反映 (根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`)
- ORCAメモ取得/更新（patientlst7v2 / patientmemomodv2）(根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`)
- Charts/Reception への復帰導線（returnTo を安全に扱う）(根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`)

## Administration（管理: system_admin）

- system_admin 専用ガード（ナビ無効化 + 直接アクセス拒否、拒否時は説明画面）(根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`)
- 設定配信/同期（chartsDisplayEnabled/chartsSendEnabled/chartsMasterSource 等、配信状態の可視化）(根拠: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`; `web-client/src/features/administration/AdministrationPage.tsx`)
- ORCA queue 操作（再送/破棄）+ 状態監視（Reception/Charts と整合）(根拠: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`; `docs/web-client/architecture/web-client-screen-review-template.md`; `web-client/src/features/administration/AdministrationPage.tsx`)
- ORCA master/system の確認（master last update、system info/daily、medicalset 検索等）(根拠: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`; `web-client/src/features/administration/AdministrationPage.tsx`)
- ORCA XML Proxy（acceptlstv2/system01lstv2/manageusersv2/insprogetv2 の原本取得）(根拠: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`; `web-client/src/features/administration/orcaXmlProxyApi.ts`)
- ORCA internal wrapper（/orca/*: medical-records, chart-subjectives 等の内製エンドポイント疎通/検証）(根拠: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`; `web-client/src/features/administration/orcaInternalWrapperApi.ts`)
- Touch/ADM/PHR 疎通導線（管理者向け接続確認）(根拠: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`; `web-client/src/features/administration/AdministrationPage.tsx`)
- Legacy REST 疎通パネル（2xx/4xx/5xx を UI 表現し、監査メタに legacy/endpoint を含める）(根拠: `docs/web-client/architecture/web-client-api-mapping.md`; `web-client/src/features/administration/LegacyRestPanel.tsx`)

## Debug / QA（本番ナビ外）

- DebugHub（デバッグ導線の集約、ENV+role gate）(根拠: `web-client/src/features/debug/DebugHubPage.tsx`; `web-client/src/AppRouter.tsx`)
- OutpatientMock（MSW/故障注入/検証補助、通常導線から分離）(根拠: `web-client/src/features/outpatient/OutpatientMockPage.tsx`; `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`)
- ORCA API Console（ORCA API の手動実行/結果表示）(根拠: `web-client/src/features/debug/OrcaApiConsolePage.tsx`)
- Legacy REST Console（Legacy REST API の手動実行/結果表示）(根拠: `web-client/src/features/debug/LegacyRestConsolePage.tsx`)

## 横断（監査/可観測性/ガード）

- RUN_ID の可視化とコピー（画面ヘッダー/バッジ）(根拠: `web-client/src/libs/observability/runIdCopy.ts`; `web-client/src/features/shared/RunIdNavBadge.tsx`)
- 監査ログ（auditEvent: action/outcome/endpoint/runId/traceId/screen 等）(根拠: `web-client/src/libs/audit/auditLogger.ts`; `docs/verification-plan.md`)
- 状態フラグ（missingMaster/cacheHit/dataSourceTransition/fallbackUsed）の統一（AuthServiceProvider で carry over）(根拠: `web-client/src/AppRouter.tsx`; `docs/web-client/architecture/future-web-client-design.md`)
- エラー共通UI（ApiFailureBanner/ToneBanner、missingMaster 復旧ガイド）(根拠: `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`; `docs/web-client/architecture/web-client-screen-review-template.md`)

## 未確認/保留（棚卸し上のメモ）

- Swing 由来の機能で Web 側に未対応の可能性が高いもの（例: StampBox、検査結果の時系列ビュー、入院系導線）は、本棚卸しでは routes/設計文書から直接の根拠を得られず「未確認」扱い (根拠: `docs/web-client/architecture/web-client-screen-structure-master-plan-20260106.md`)
- 「CLAIM 廃止」後の会計送信/CLAIM相当機能の最終運用（UI文言/導線の完全除去の完了条件）は、`docs/verification-plan.md` の手順を継続して満たすことで担保する（この文書は機能一覧であり、実測の完了を保証しない）(根拠: `docs/verification-plan.md`)
