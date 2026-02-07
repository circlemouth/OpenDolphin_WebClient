# サーバー機能一覧（差し込み本文案・ID版）

モダナイズ版サーバーで提供する REST API を、機能IDで管理する。一次の正本は `MODERNIZED_REST_API_INVENTORY.md` とし、本章では代表行を示す。最終版ではカテゴリ別に全行を展開する。

| 機能ID | 機能名 | API / バッチ | 役割概要 | 依存先 | 備考 |
| --- | --- | --- | --- | --- | --- |
| SVR-001 | ユーザー取得（本人） | `GET /user/{userId}` | ログインユーザー本人情報の取得。 | Auth | UserResource |
| SVR-002 | ユーザー一覧 | `GET /user` | 施設所属ユーザー一覧の取得。 | Auth | UserResource |
| SVR-003 | 月次活動ログ取得 | `GET /dolphin/activity/{yyyy,MM,count}` | 月次活動ログの取得。 | 監査 | SystemResource |
| SVR-004 | JMARIコード取得 | `GET /serverinfo/jamri` | JMARIコードを返却。 | 設定 | ServerInfoResource |
| SVR-005 | 患者取得（ID） | `GET /patient/id/{pid}` | 患者IDで単一患者を取得。 | DB | PatientResource |
| SVR-006 | 患者登録 | `POST /patient` | 患者の新規登録。 | DB | PatientResource |
| SVR-007 | 受付登録 | `POST /pvt` | 受付登録の実行。 | DB | PVTResource |
| SVR-008 | 予約/受付一覧 | `GET /schedule/pvt/{params}` | 予約/受付一覧の取得。 | DB | ScheduleResource |
| SVR-009 | カルテ保存 | `POST /karte/document` | 新規カルテ保存。 | DB | KarteResource |
| SVR-010 | SSE購読開始 | `GET /chart-events` | ChartEvent のSSE購読を開始。 | SSE | ChartEventStreamResource |

# トレーサビリティ表（画面 x サーバー機能）（差し込み本文案・ID版）

画面IDと機能IDの対応表。画面設計書の「API一覧」テーブルを正とし、本章ではサンプル行を示す。

| 画面ID | 画面名 | 機能ID | 機能名 | 依存区分 | 備考 |
| --- | --- | --- | --- | --- | --- |
| SCR-001 | Reception | SVR-007 | 受付登録 | 主要 | 受付登録/取消フローに利用 |
| SCR-001 | Reception | SVR-008 | 予約/受付一覧 | 主要 | 受付一覧の基礎データ |
| SCR-002 | Charts | SVR-009 | カルテ保存 | 主要 | 文書保存/添付管理の土台 |
| SCR-002 | Charts | SVR-010 | SSE購読開始 | 補助 | ChartEvent の更新通知 |
| SCR-003 | Patients | SVR-005 | 患者取得（ID） | 主要 | 患者参照・編集の起点 |
| SCR-003 | Patients | SVR-006 | 患者登録 | 主要 | 患者新規登録 |
| SCR-004 | Administration | SVR-001 | ユーザー取得（本人） | 補助 | 管理画面の権限/状態確認 |

## 不足・要確認事項（差し込み用）
- モダナイズ版 REST API の OpenAPI（yaml/json）の正本が未確認。現時点の一次は `MODERNIZED_REST_API_INVENTORY.md`。
- 画面対応表の正本は分散（web-client-api-mapping + 各画面設計）。単一のトレーサビリティ表は未整備。
- `/api01rv2/*` など XML 系の ORCA 連携エンドポイントが server-modernized の「管理範囲」か、外部 ORCA 直結/プロキシかの明記が必要。
- Legacy REST 互換 API（Administration/Debug）を「本番導線の機能一覧」に含めるか要判断。
- CLAIM 廃止対象（`/karte/claim`, `/schedule/document`, `/serverinfo/claim/conn` 等）は「対象外」欄へ明示が必要。
