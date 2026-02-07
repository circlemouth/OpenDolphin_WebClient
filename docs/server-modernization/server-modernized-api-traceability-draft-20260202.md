# モダナイズ版サーバー機能一覧 / 画面対応（トレーサビリティ）草案

- 目的: 最終計画書に差し込むための雛形。モダナイズ版サーバーAPI一覧と画面対応表のたたき台を提供する。
- 参照元:
  - `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `docs/web-client/architecture/web-client-emr-reception-design-20260128.md`
  - `docs/web-client/architecture/web-client-emr-charts-design-20260128.md`
  - `docs/web-client/architecture/web-client-emr-patients-design-20260128.md`
  - `docs/web-client/architecture/doctor-workflow-status-20260120.md`

## 1. サーバー機能一覧（モダナイズ版 REST API）

| カテゴリ | HTTP | パス | 概要 | 参照 |
| --- | --- | --- | --- | --- |
| User | GET | `/user/{userId}` | ログインユーザー本人情報の取得。 | MODERNIZED_REST_API_INVENTORY.md（UserResource） |
| User | GET | `/user` | 施設所属ユーザー一覧取得。 | MODERNIZED_REST_API_INVENTORY.md（UserResource） |
| System | GET | `/dolphin/activity/{yyyy,MM,count}` | 月次活動ログ取得。 | MODERNIZED_REST_API_INVENTORY.md（SystemResource） |
| ServerInfo | GET | `/serverinfo/jamri` | JMARI コード取得。 | MODERNIZED_REST_API_INVENTORY.md（ServerInfoResource） |
| Patient | GET | `/patient/id/{pid}` | 患者 ID 検索（単一患者）。 | MODERNIZED_REST_API_INVENTORY.md（PatientResource） |
| Patient | POST | `/patient` | 患者登録。 | MODERNIZED_REST_API_INVENTORY.md（PatientResource） |
| PVT | POST | `/pvt` | 受付登録。 | MODERNIZED_REST_API_INVENTORY.md（PVTResource） |
| Schedule | GET | `/schedule/pvt/{params}` | 予約/受付一覧取得。 | MODERNIZED_REST_API_INVENTORY.md（ScheduleResource） |
| Appo | PUT | `/appo` | 予約一覧更新。 | MODERNIZED_REST_API_INVENTORY.md（AppoResource） |
| Karte | POST | `/karte/document` | 新規カルテ保存。 | MODERNIZED_REST_API_INVENTORY.md（KarteResource） |
| Karte | GET | `/karte/diagnosis/{karteId,from[,activeOnly]}` | 病名一覧取得。 | MODERNIZED_REST_API_INVENTORY.md（KarteResource） |
| Stamp | GET | `/stamp/tree/{userPk}` | 個人スタンプツリー取得。 | MODERNIZED_REST_API_INVENTORY.md（StampResource） |
| ChartEvent | GET | `/chart-events` | SSE 購読開始。 | MODERNIZED_REST_API_INVENTORY.md（ChartEventStreamResource） |
| MML | GET | `/mml/karte/json/{param}` | カルテ文書 JSON 出力。 | MODERNIZED_REST_API_INVENTORY.md（MmlResource） |
| ORCA | GET | `/orca/facilitycode` | ORCA 施設コード取得。 | MODERNIZED_REST_API_INVENTORY.md（OrcaResource） |

> 追記方針: 上表はカテゴリごとの代表行のみ。最終計画書へはカテゴリ別に全行を展開する。

## 2. 画面対応（トレーサビリティ）表

| 画面 | 機能/目的 | API | 主なデータ/出力 | 備考/参照 |
| --- | --- | --- | --- | --- |
| Reception | 受付一覧 | `/orca/appointments/list` + `/orca/visits/list` | 予約/受付リストの統合 | web-client-emr-reception-design-20260128.md（7. API一覧） |
| Reception | 請求/キュー | `/orca/claim/outpatient` | bundles/queueEntries/claimStatus | web-client-emr-reception-design-20260128.md（7. API一覧） |
| Reception | 受付登録/取消 | `/orca/visits/mutation` | 受付登録/取消結果 | 同上 |
| Charts | 請求状態/キュー | `/orca/claim/outpatient`, `/api/orca/queue` | bundles/queueEntries + 再送 | web-client-emr-charts-design-20260128.md（7.1/7.2） |
| Charts | 病名 CRUD | `/orca/disease/import/{patientId}`, `/orca/disease` | 病名一覧/更新 | web-client-emr-charts-design-20260128.md（7.3） |
| Charts | 文書/画像/添付 | `/karte/document`, `/karte/images`, `/karte/image`, `/karte/attachment` | 文書/画像/添付の保存・取得 | web-client-emr-charts-design-20260128.md（7.4） |
| Charts | ORCA 送信/会計 | `/api21/medicalmodv2`, `/api21/medicalmodv23`, `/api01rv2/incomeinfv2` | 送信/会計補助 | web-client-emr-charts-design-20260128.md（7.2） |
| Patients | 患者検索 | `/orca/patients/local-search` | 患者一覧 | web-client-emr-patients-design-20260128.md（7. API一覧） |
| Patients | 患者更新 | `/orca12/patientmodv2/outpatient` | create/update/delete | 同上 |
| Administration | Legacy REST 互換確認 | `/pvt` `/karte` `/patient` ほか | 2xx/4xx 判定 | web-client-api-mapping.md（3.6） |

> 追記方針: 画面別設計書の「API一覧」テーブルを起点に、最終計画書のトレーサビリティ表へ統合する。

## 3. 不足・要確認事項（差し込み用）
- モダナイズ版 REST API の OpenAPI（yaml/json）の正本が未確認。現時点の一次は `MODERNIZED_REST_API_INVENTORY.md`。
- 画面対応表の正本は分散（web-client-api-mapping + 各画面設計）。単一のトレーサビリティ表は未整備。
- `/api01rv2/*` など XML 系の ORCA 連携エンドポイントが server-modernized の「管理範囲」か、外部 ORCA 直結/プロキシかを最終計画書で明記する必要あり。
- Legacy REST 互換 API（Administration/Debug）を「本番導線の機能一覧」に含めるかの判断が必要。
- CLAIM 廃止対象（`/karte/claim`, `/schedule/document`, `/serverinfo/claim/conn` 等）は最終計画書の「対象外」欄へ明示が必要。
