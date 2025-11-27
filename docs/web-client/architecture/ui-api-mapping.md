# UI と API のマッピング

**RUN_ID**: 20251127T120000Z

## 1. ルーティング → AppShell → サイドバー構成
- `web-client/src/app/router.tsx` では `<RequireAuth>` の内側で `AppShell` をラップし、`/patients`, `/reception`, `/facility-schedule`, `/charts`, `/administration/*` を Suspense 経由で読み込む。`/login` は認証境界の外、管理系のサブパスは `RequireRole(['admin'])` でガードする。
- `web-client/src/app/layout/AppShell.tsx` は `NavList` で4つの主要画面へナビゲートし、ヘッダー右端にユーザー情報・通知・管理メニュー・ログアウトを配置する。`SidebarContext`（`web-client/src/app/layout/SidebarContext.tsx`）と `Body`/`ContentRegion` により、画面固有のサイドバー（ReceptionSidebar/Chart side panels など）を動的に注入し、`data-app-section` 属性でチャート画面のスクロールロックや `ReplayGapBanner` のフィルタを制御する。
- `Stack`, `SurfaceCard`, `StatusBadge` を使った UI セクションは `<Main>` 内に並べられ、サイドバーがある場合は横並びで画面分割。`AppShell` は各画面の `sidebarController` を共有しており、Charts や Reception がサイドバーから詳細情報を切り替えて表示する。

## 2. 画面／機能ごとの責務と注入ポイント
### 2.1 Reception (`/reception`)
- `web-client/src/features/reception/pages/ReceptionPage.tsx` は `useReceptionQuery` 系フックで旧 API (`/pvt`, `/pvt2`, `/patient/pvt`, `/patient/documents/status`) から受付一覧・履歴・仮保存・メモ・予約履歴を取得し、`ReceptionSidebarContent`/`VisitManagementDialog` で `SurfaceCard` に埋め込む。
- API から返る `PatientVisitSummary.state`・`ownerUuid`・`memo` を `deriveStatusBadge` で `StatusBadge` に変換し、診察中・呼出済み・待機中などの優先度表現に利用。`VisitManagementDialog` や `ScheduleReservationDialog` でも `StatusBadge` を使い、早期/遅延/ロック中といった進捗を tone で統一。
- 受付操作 (`registerVisit`, `updateVisitState`, `updateLegacyVisitMemo`, `registerLegacyVisit`) では `recordOperationEvent` を呼び出して audit 履歴を残す。`Stack` と `SurfaceCard` を組み合わせて、患者リスト・メモ・アラートを上下/左右に整列。サイドバーの患者詳細・仮保存一覧にも `StatusBadge` を繰り返し使い、危険（`danger`：仮保存/ドキュメントマーク）→注意（`warning`：安全ノート/バーコード候補）→通常（`info`/`neutral`）の優先度を維持。

### 2.2 Patients (`/patients`)
- `PatientsPage` は `useQuery`＋`searchPatients` で `/patient/{name|kana|id|digit}` を横断し、ドロップダウン検索・新規作成・編集・メモ保存 (`/karte/memo`) を制御。`PatientEditorPanel` では `SurfaceCard` を段組で並べ、`Stack` で入力列の間隔を統一。
- `StatusBadge` は安全情報（アラート/所見）や `mode` 表示 (`create`/`edit`) に使われ、`tone='danger'` をメモ警告にあてて視認性を担保。患者詳細から受け取った保険情報・住所を `SurfaceCard` に分けて配置し、API レスポンスをそのままカード内に注入。

### 2.3 Schedule (`/facility-schedule`)
- `FacilitySchedulePage` は `/schedule/pvt/${date}` で施設スケジュール一覧を取得し、`Stack` 配下の `SurfaceCard` で時間帯/担当医・保険をまとめる。`ScheduleReservationDialog` は `StatusBadge` で編集中・自端末他端末ロック・重複予約を表示。
- `createScheduleDocument` (`POST /schedule/document`) や `deleteScheduledVisit` (`DELETE /schedule/pvt/{visitId,...}`) を呼び出し、API 成功時に `recordOperationEvent` でログを残す。`StatusBadge` tone に `info`/`warning` を使い、進捗や再送信要否を示す。

### 2.4 Charts (`/charts` + `/charts/:visitId`)
- `ChartsPage`（`features/charts/pages/ChartsPage.tsx`）は `PatientHeaderBar`、`CareMapPanel`、`OrderConsole`、`DocumentTimelinePanel`、`WorkSurface` などを `SurfaceCard` で構成し、`Stack` で上下/左右の余白を統一。カルテ・文書・検査データ・問診・オーダーが同一画面でシームレスに切り替わる。
- `/api` 系エンドポイント（`/api/pvt2/pvtList`, `/api/charts/patientList`, `/api/patient/id/:patientId`, `/api/karte/:params`, `/api/chart-events`, `/api/chartEvent/subscribe`, `/api/chartEvent/event`, `/api/karte/images`, `/api/lab/module/:params`, `/api/stamp/tree/sync`）と `orders`/`documents`/`claims` 系 (`/karte/claim`, `/karte/document`, `/karte/document/pvt`, `/karte/diagnosis`, `/karte/observations`, `/karte/moduleSearch`, `/karte/routineMed/list`, `/odletter/*`) を横断し、`useChartsReplayGap` などで `ReplayGap` のバナー制御を行う。`DocumentTimelinePanel` では `StatusBadge` が Document 状態（未確認/確定/テンポラル）を示し、`OrderConsole` では `message.severity` を `StatusBadge` tone に流用して優先度・監査メッセージを可視化。
- ORCA 連携は `features/charts/api/orca-api.ts` の `fetchWithResolver` → `resolveOrcaMasterSource` で `/orca/master/*` への接続（`/orca/master/generic-class`, `/orca/master/hokenja`, `/orca/master/address`, `/orca/master/youhou`, `/orca/master/material`, `/orca/master/kensa-sort`, `/orca/master/etensu`）を制御し、`dataSource/cacheHit/missingMaster/fallbackUsed/runId` を CRUD や UI に伝搬。

### 2.5 Administration (`/administration/*`)
- `UserAdministrationPage`, `SystemPreferencesPage`, `StampManagementPage`, `PatientDataExportPage` は管理者ロール限定で `SurfaceCard` 付属の `Stack` でフォームを整え、`StatusBadge` でロール（admin/user）、システム状態（CloudZero/Claim）を表示。
- `user-api` は `/user` ベースの CRUD、`/user/facility` で施設情報更新、`/user/name/{userId}` で表示名を解決。
- `system-api` は `/serverinfo/jamri`, `/serverinfo/claim/conn`, `/serverinfo/cloud/zero` でサーバーステータスを取り、`/dolphin/license`・`/dolphin/cloudzero/sendmail`・`/dolphin` などの管理操作を提供。`phr-api` では `/20/adm/phr/*` 系で PHR キー・コンテナ・テキストを取得・更新。`patient-export-api` は `/patient/all`, `/patient/custom/{condition}`, `/patient/count/{prefix}` で CSV/JSON のエクスポートを支援。
- これら管理画面では `recordOperationEvent` によってログが生成され、`StatusBadge` tone を `info/warning/danger` で明示的に切り替え（例: ライセンス送信成功は `info`、Failure は `danger`）する。

## 3. API 接続マトリクス（画面 × エンドポイント）
| 画面・機能 | 主なエンドポイント | 補足 | 
| --- | --- | --- |
| Reception 受付一覧・入退室 | `GET /pvt2/pvtList`, `GET /pvt/{date,...}`, `POST /pvt2`, `POST /pvt`, `PUT /pvt/{visitId,state}`, `DELETE /pvt2/{visitId}`, `GET /patient/pvt/{prefix}`, `GET /patient/documents/status`, `GET /patient/pvt/{prefix}` | 旧 API と新 API を両立しており、`recordOperationEvent` で操作 audit を残す。| 
| 予約・当日予定 | `POST /orca/appointments/list`, `POST /orca/appointments/mutation` | ORCA 側との予約登録/更新/キャンセル。`AppointmentSummary` を `SurfaceCard` で整形し、`StatusBadge` で状態（新規/更新/キャンセル）を示す。| 
| Patients 患者検索・編集 | `GET /patient/{name|kana|id|digit}/{keyword}`, `POST /patient`, `PUT /patient`, `PUT /karte/memo` | 検索時は `buildPatientSearchPath` で `PatientSearchMode` を切り替え、レスポンスを `PatientEditorPanel`/テーブルに注入。| 
| Schedule 施設スケジュール | `GET /schedule/pvt/{date}`（担当医絞込可）、`POST /schedule/document`, `DELETE /schedule/pvt/{visitId,ptPK,date}` | `Layout` は `Stack`+`SurfaceCard` で予約リストとアクションを並列表示。| 
| Charts カルテ/文書 | `/api/pvt2/pvtList`, `/api/charts/patientList`, `/api/patient/id/:patientId`, `/api/karte/pid/:params`, `/api/karte/freedocument/:patientId`, `/api/lab/module/:params`, `/api/karte/docinfo/:params`, `/api/chart-events`, `/api/chartEvent/subscribe`, `/api/chartEvent/event`, `/api/chartEvent/:id`, `/api/karte/images`, `/api/karte/attachment/:id`, `/api/stamp/tree`, `/api/stamp/tree/sync`, `/karte/documents/{ids}`, `/karte/document`, `/karte/document/pvt/{visitId,state}`, `/karte/diagnosis`, `/karte/observations`, `/karte/moduleSearch/{params}`, `/karte/claim`, `/karte/routineMed/list/{karteId}`, `/odletter/list/{karteId}`, `/odletter/letter/{id}` | `OrderConsole`, `ProblemListCard`、`DocumentTimelinePanel` に API データを注入。`StatusBadge` は document status/delivery severity をビジュアル化。| 
| ORCA マスタデータ | `/orca/master/{generic-class,generic-price,youhou,material,kensa-sort,hokenja,address,etensu}` + `WEB_ORCA_MASTER_SOURCE`/`VITE_DISABLE_MSW` で切り替え | `resolveOrcaMasterSource` で `mock/snapshot/server/fallback` を順に試行し、`dataSource/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` を UI に伝搬。| 
| Administration 管理機能 | `/user`, `/user/{userId}`, `/user/facility`, `/user/name/{userId}`, `/serverinfo/{jamri,claim/cloud}`, `/dolphin`, `/dolphin/license`, `/dolphin/cloudzero/sendmail`, `/20/adm/phr/{patient,accessKey,container,medication,labtest,disease,allergy}`, `/patient/{all,custom/{cond},count/{prefix}}` | `UserAdministrationPage`, `SystemPreferencesPage`、`PatientDataExportPage` で `SurfaceCard` を囲み、`StatusBadge` で操作状態/サーバー応答を常時表示。| 
| Auth/Session | `GET /user/{facility:userId}` | `auth/auth-service.ts` で MD5 変換 + `createAuthHeaders` を利用してセッションを保持し、`httpClient` に `authHeaderProvider` を登録。|
| MSW 開発モード | `web-client/src/mocks/handlers/chartHandlers.ts` (`/api/*` 周辺) + `orcaMasterHandlers.ts` (`/orca/master/*`) | フェーズ未実装の API に対し固定 JSON を返却し、`x-compat` フラグで LP/SSE/hints を模擬。|

## 4. 接続インフラと監査メタ／悪天候対応
- `web-client/src/libs/http/httpClient.ts` は `VITE_API_BASE_URL` を基底 URL に、`withCredentials` + CSRF トークン (`ODW_XSRF`/`X-CSRF-Token`) を自動添付。リトライは 1 回、`traceparent/x-request-id` を付与し、`@opentelemetry/api` で Span を作成。監査用 `auditLogger`・`recordOperationEvent`・`pushTraceNotice` でリクエスト lifecycle を通知し、`traceContext` を更新。
- `auth/auth-service.ts` は `hashPasswordMd5` + `createAuthHeaders` で `/user/{facility:userId}` を GET し、`persistAuthSession` でセッションを保持。`AppShell` は `useAuth` から `session` を読み出してユーザー表示と権限チェックを行う。
- `resolveOrcaMasterSource`（`web-client/src/features/charts/api/orca-source-resolver.ts`）は `WEB_ORCA_MASTER_SOURCE`/`sessionStorage:orcaMasterSource`/`VITE_DISABLE_MSW` を参照し、`mock→snapshot→server→fallback` の順に `getOrcaMasterBridgeBaseUrl()` へ接続。`fetchWithResolver` は各マスターからの `dataSourceTransition/cacheHit/missingMaster/fallbackUsed/runId` を収集し、Charts UI に監査メタを渡す。
- `web-client/src/mocks/handlers/chartHandlers.ts` は `/api/pvt2/pvtList` などを固定 JSON で返し、Long-Poll/SSE/DELETE で `X-Compat-Mode` を返して実運用相当の挙動を模擬。`orcaMasterHandlers.ts` によって `address/hokenja/youhou/etensu` の MSW フィクスチャを提供し、`fetchWithResolver` の `mock`/`snapshot` パスを安定化させる。

## 5. 再利用コンポーネントと優先度・進捗・監査表示ルール
- `Stack` (`web-client/src/components/Stack.tsx`): `gap/direction/align/justify/wrap` を制御可能。`Reception` のサイドバー、`Charts` の WorkSurface、`Administration` のフォームで `gap` を 12/16 に揃え、API からのデータカードを均一な余白で並べる。
- `SurfaceCard` (`.../SurfaceCard.tsx`): `tone`=`default|muted|elevated|warning|danger`、`padding`=`sm|md|lg` を指定可能。`Charts` では `SafetySummary` を `tone='muted'` で厳重表示、`Reception` の患者詳細は `tone='elevated'` で強調、`Administration` のシステム警告は `tone='warning'`/`'danger'` で緊急度を視覚化する。
- `StatusBadge` (`.../StatusBadge.tsx`): `tone`=`info|success|warning|danger|neutral`、`size`=`sm|md` を統一。`Reception` の来院状態・仮保存文書・安全ノート、`Charts` の診療行為/メッセージ `severity`/`claimSendEnabled`、`Schedule` の他端末ロック、`Administration` のロール/システムステータスで tone を再利用して優先度を伝える。`danger` は即時注意（仮保存カルテ/監査マーク）、`warning` は注意が必要な進捗（呼出済み/バーコード候補）、`info`/`success` は標準進捗/完了。`StatusBadge` のテキストは API が返す `state`/`statusLabel` と直接マッピングされ、props だけで調整可能。
- `Auditing` と `UI`: `recordOperationEvent` のメッセージは `SurfaceCard` 内の説明文や `StatusBadge` の補足テキストとしても再利用。ORCA master 取得時の `runId`/`dataSourceTransition` は `features/charts/components/layout/StatusBar` や `SafetySummaryCard` に表示され、監査トレースとして `SurfaceCard` の `tone='muted'` で控えめに掲載する。

本ドキュメントは上記 RUN_ID の証跡として `docs/web-client/architecture/ui-api-mapping.md` に記録しました。
