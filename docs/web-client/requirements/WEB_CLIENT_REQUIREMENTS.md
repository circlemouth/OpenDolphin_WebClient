# Webクライアント開発 要件定義書

## 1. 目的と背景
- 既存の OpenDolphin 電子カルテサーバー（`server` モジュール）を改変せず、その REST 機能を利用する新規 Web クライアントを開発する。
- Web クライアントから WEB ORCA 連携機能（点数マスター参照、病名マスター参照、併用禁忌チェック等）を利用できるようにする。
- 既存 Swing クライアントの主要業務機能をブラウザ経由で提供し、将来的な保守性・拡張性を向上させることが目的。

## 2. 範囲
- **対象**: Web ブラウザ向け電子カルテ UI、および必要な軽微な API 拡張（既存サーバーの破壊的変更は不可）。
- **非対象**: 既存サーバーのドメインロジック変更、DB スキーマ変更、大規模なミドルウェア構成変更。

## 3. システム前提
- サーバーは既存の WildFly 上 WAR (`opendolphin-server`) を継続利用する。
- 認証は現在のヘッダー認証方式（`userName` + MD5 パスワード）を継続、必要に応じて Web 用のセッション管理層を追加実装。
- ORCA 連携は `server/src/main/java/open/orca/rest/OrcaResource.java` が提供する REST API を利用し、必要なら API 利用手順のみを整理する。
- クライアントはモダンブラウザ（Chrome 最新版、Firefox ESR、Edge Chromium）を主要ターゲットとする。

## 4. システム構成と連携
- **Web クライアント → 電子カルテサーバー**: REST/JSON 通信。HTTPS 推奨。CORS または同一オリジン構成を選択。
- **電子カルテサーバー → ORCA**: 既存 `ORCAConnection` 経由（DB or ORCA API）。Web クライアントはサーバー経由で間接利用。
- **ユーザー認証**: ログイン画面で施設 ID / ユーザー ID / パスワードを収集し、サーバーの `/user/{fid:userId}` API を呼び出す。
- **通知/リアルタイム**: 現行の長輪講 API (`/chartEvent/subscribe`) を利用、必要に応じて SSE/WS へのラップを検討。

## 5. 機能要件
### 5.1 認証・セッション管理
- F1: 施設 ID/ユーザー ID/パスワードでログインし、サーバーから UserModel を取得できること。
- F2: ログイン成功後、ユーザー情報・施設情報をフロントで保持し、REST 呼び出し時にヘッダーへ `userName` / `password(MD5)` / `clientUUID` を付与する。
- F3: ログアウト操作で保有している認証情報を破棄し、サーバー側の長輪講接続も切断する。

### 5.2 患者検索・一覧
- F4: `/patient/name/{name}` 等の API を利用し、患者検索条件（漢字/カナ/ID/日付）を指定して一覧取得できる UI を提供する。
- F5: 患者一覧に最終受診日、健康保険情報（HealthInsuranceModel）など主要属性を表示する。

### 5.3 カルテ閲覧・編集
- F6: 患者選択後、`/karte/` API を使用してカルテ履歴を取得し、文書／モジュール／添付画像を閲覧できる。
- F7: カルテ新規作成・編集時に既存の DocumentModelConverter フォーマットでサーバーに送信し、保存結果を画面に反映する。
- F8: カルテ編集中は `clientUUID` を利用して排他制御状態をサーバーに通知し、他端末からの編集をブロックする。
- UI表示ラベル: サイドバーでは /charts ルートを「カルテ閲覧」と表記し、カルテ画面の観察機能は「観察記録」タブとして提供する。（根拠: web-client/src/app/layout/AppShell.tsx, web-client/src/features/charts/components/ObservationPanel.tsx）

### 5.4 スタンプ・オーダリング
- F9: スタンプ（診療行為テンプレート）の閲覧・検索・挿入をサポートする。必要に応じて `/stamp` 系 API を利用。
- F10: ORCA 入力セットをスタンプとして取り込み、カルテへ反映できること（`/orca/inputset` 等）。

### 5.5 ORCA 連携
- F11: 点数マスター検索 UI を提供し、`/orca/tensu/*` エンドポイントから取得した結果を表示・選択できる。
- F12: 病名マスター、一般名検索など ORCA 関連 API を同様に利用できること。
- F13: 併用禁忌チェック機能を提供し、選択中の薬剤コード集合を `/orca/interaction` へ送信して結果を提示する。

### 5.6 文書出力・PDF
- F14: 既存の PDF 生成機能（サーバー側または Velocity テンプレート）をトリガーし、生成済みファイルをダウンロード表示できるようにする。

### 5.7 通知・リアルタイム更新
- F15: 受付リストやカルテ状態のリアルタイム更新を実装する。まずは既存のロングポーリング実装を Web で再利用し、将来的に WebSockets/SSE に置き換え可能な構造とする。

## 6. 非機能要件
- N1: 基本応答時間は 3 秒以内（ORCA マスター検索等の重量 API は 5 秒以内）を目標。
- N2: 同時接続端末数は施設あたり 30 クライアントまでを想定し、サーバー側リソース消費を増やさない実装とする。
- N3: UI 文字コードは UTF-8、既存の多言語プロパティを流用できる構造を維持。
- N4: 個人情報を扱うため HTTPS を必須とし、ブラウザキャッシュに患者情報を残さない。
- N5: アクセシビリティ（キーボード操作、スクリーンリーダー対応）を考慮。
- N6: ブラウザバックが業務操作を破壊しないようルーティング制御を実装。

## 7. セキュリティ要件
- S1: 認証ヘッダーに使用する MD5 ハッシュは平文パスワードをブラウザ側で MD5 化して送信する方式を継続。ただし将来的にトークン認証へ移行できるようアーキテクチャを分離。
- S2: CSRF 対策として、REST 呼び出し時にクライアント固有トークンを付与する。ヘッダー認証のみの場合は `clientUUID` を用いた簡易保護を行う。
- S3: XSS/Content Security Policy を適用し、外部スクリプトの取り込みを制限。
- S4: ログには個人情報を過度に残さないようマスキングを行う。

## 8. 移行・互換性要件
- T1: 既存 Swing クライアントとの同時稼働が可能であること。同じサーバー/API を共有し、相互干渉しない。
- T2: 段階導入を想定し、機能単位で Web クライアントが未対応の場合は Swing クライアント利用を継続できるよう運用計画を立案。
- T3: 既存テンプレートや PDF 設定ファイルはそのまま利用できるようにし、もしブラウザ側で編集が必要なら互換フォーマットを維持。

## 9. 運用・診断要件
- O1: 利用ログ（操作、API エラー）をサーバー側とクライアント側で収集し、トレーサビリティを確保。
- O2: エラーが発生した場合にユーザーへ意味のあるメッセージを出し、再試行・サポート依頼が可能。
- O3: バージョン情報やビルド番号を Web UI から確認できるようにする。

## 10. 開発・テスト要件
- D1: REST API 呼び出し層を SDK 風にラップし、単体テスト（API モック）を実施しやすくする。
- D2: クロスブラウザテスト、レスポンシブデザイン（最低限 1280px 幅）を確認。
- D3: ORCA 連携テストでは本番と同一バージョンの ORCA 環境（WEB ORCA含む）でマスター／併用禁忌などが正しく応答することを検証。
- D4: 負荷テストで想定同時アクセス数（N2）に耐えられることを確認。

## 11. 未決定事項 (ToDo)
- 認証方式を今後トークン化するか、既存ヘッダー方式を継続するかの最終判断。
- ロングポーリングを SSE / WebSocket へ移行するタイムライン。
- PDF 生成をサーバー側で継続するか、ブラウザ対応の別ソリューションへ移行するかの方針。
- スタンプ編集 UI をブラウザでどこまで再現するかの詳細要件。

## 12. 参考ファイル
- `server/src/main/java/open/dolphin/rest/PatientResource.java` (患者関連 API)
- `server/src/main/java/open/dolphin/rest/ChartEventResource.java` (排他・イベント通知 API)
- `server/src/main/java/open/orca/rest/OrcaResource.java` (ORCA 連携 API)
- `client/src/main/java/open/dolphin/delegater/OrcaRestDelegater.java` (現行クライアントの ORCA 利用方法)

## 13. WEB ORCA 取得情報カタログ
- サーバー側では `server/src/main/java/open/orca/rest/OrcaResource.java` を中心に WEB ORCA から情報を取得する。主なアクセス経路は以下の二系統。
  - ORCA DB (PostgreSQL) への読み出し: `ORCAConnection` を経由して `tbl_*` 系テーブルを参照し、REST API のレスポンスを組み立てる。
  - WEB ORCA API (`/api01rv2/*`) への HTTP 呼び出し: `OrcaConnect` を利用し XML レスポンスを取得後、サーバー内で整形する。
- `custom.properties` は接続設定や初期値（JMARI コード、保険医療機関コード、処方区分の既定値など）を提供し、`claim.conn=server` 時はサーバーから直接 ORCA DB へ接続する。

### 13.1 サーバー初期化・施設メタ情報
- **`@PostConstruct OrcaResource#setupParams()`**
  - ORCAアクセス媒体: `custom.properties`, ORCA DB (`tbl_syskanri`, `tbl_dbkanri`)
  - 主な取得情報:
    - 病院番号 (`tbl_syskanri.kanritbl` → `HOSP_NUM`)
    - ORCA データベースバージョン (`tbl_dbkanri.version` → `DB_VERSION`)
    - 院内/院外処方の既定値 (`custom.properties` の `rp.default.inout` → `RP_OUT`)
  - 補足: 取得した値は後続のマスター検索や患者病名取得で参照される前提情報。

### 13.2 施設識別子
- **`GET /orca/facilitycode`**
  - ORCAアクセス媒体: `custom.properties` (`healthcarefacility.code`, `jamri.code`)／フォールバックで ORCA DB (`tbl_syskanri` `kanricd='1001'`)
  - 主な取得情報:
    - 10 桁の保険医療機関コード
    - `JPN` + 12 桁 JMARI コード（合計 15 文字）
  - レスポンス形式: プレーンテキスト（例: `1234567890JPN123456789012`）

### 13.3 点数マスター参照
- **`GET /orca/tensu/shinku/{param}/`**
  - ORCAアクセス媒体: ORCA DB (`tbl_tensu`)
  - 主な入力: `param = "{診療区分正規表現},{YYYYMMDD}"`（例: `^21,20250101`）
  - 取得情報: `srycd`, `name`, `kananame`, `tensikibetu`, `ten`, `nyugaitekkbn`, `routekkbn`, `srysyukbn`, `hospsrykbn`, `yukostymd`, `yukoedymd`
  - レスポンス形式: `TensuList` JSON
- **`GET /orca/tensu/name/{param}/`**
  - ORCAアクセス媒体: ORCA DB (`tbl_tensu`)
  - 主な入力: `param = "{名称またはカナ},{YYYYMMDD},{partialMatch}"`（`partialMatch` は `true|false`）
  - 取得情報: 上記 `TensuMaster` と同一フィールドに加え `taniname`, `ykzkbn`, `yakkakjncd`
  - 補足: 単一文字検索時は完全一致、その他は部分一致オプションに従い正規表現検索
- **`GET /orca/tensu/code/{param}/`**
  - ORCAアクセス媒体: ORCA DB (`tbl_tensu`)
  - 主な入力: `param = "{点数コード正規表現},{YYYYMMDD}"`
  - 取得情報: `TensuMaster` フィールド一式（`srycd`, `name` など）
- **`GET /orca/tensu/ten/{param}/`**
  - ORCAアクセス媒体: ORCA DB (`tbl_tensu`)
  - 主な入力: `param = "{点数値または範囲},{YYYYMMDD}"`（例: `100-200,20250101` または `150,20250101`）
  - 取得情報: `TensuMaster` フィールド一式（範囲指定で点数フィルタリング）

### 13.4 病名マスター
- **`GET /orca/disease/name/{param}/`**
  - ORCAアクセス媒体: ORCA DB (`tbl_byomei`)
  - 主な入力: `param = "{病名漢字またはカナ},{YYYYMMDD},{partialMatch}"`
  - 取得情報: `byomeicd`（病名コード）, `byomei`, `byomeikana`, `icd10_1`, `haisiymd`
  - レスポンス形式: `DiseaseList` JSON（`DiseaseEntry` 配列）

### 13.5 薬剤・一般名・相互作用
- **`PUT /orca/interaction`**
  - ORCAアクセス媒体: ORCA DB (`tbl_interact`, `tbl_sskijyo`)
  - 主な入力: JSON ボディ `InteractionCodeList` (`codes1`, `codes2` に点数コード配列)
  - 取得情報: `drugcd`（組合せ 1）, `drugcd2`（組合せ 2）, `syojyoucd`（症状コード）, `syojyou`（併用禁忌理由）
  - レスポンス形式: `DragInteractionListConverter`（`DrugInteractionModel` の配列）
- **`GET /orca/general/{srycd}`**
  - ORCAアクセス媒体: ORCA DB (`tbl_tensu` ⇔ `tbl_genericname`)
  - 主な入力: `srycd`（点数コード）
  - 取得情報: 対応する一般名（`genericname`）を `CodeNamePack` で返却

### 13.6 入力セット／スタンプ展開
- **`GET /orca/inputset`**
  - ORCAアクセス媒体: ORCA DB (`tbl_inputcd`)
  - 主な入力: なし（院内病院番号でフィルタ）
  - 取得情報: `P*`/`S*` 入力セットのコード・表示名 (`cdsyu`, `inputCd`, `sryKbn`, `sryCd`, `dspName`, `dspSeq`, `termId`, `opId`, `creYmd`, `upYmd`, `upHms`)
  - レスポンス形式: `OrcaInputCdList` JSON（`OrcaInputCd` 配列）
- **`GET /orca/stamp/{param}`**
  - ORCAアクセス媒体: ORCA DB (`tbl_inputset`, `tbl_tensu`)
  - 主な入力: `param = "{セットコード},{スタンプ名}"`
  - 取得情報: 指定入力セットを `ModuleModel`（`BundleDolphin` 派生）へ展開した診療行為リスト
    - 各 `ClaimItem` に `code`, `name`, `number`, `unit`, `classCode`（手技/薬剤/材料/放射線部位など）, `receiptCode` などを付与
  - 補足: セットの有効期間 (`yukostymd`, `yukoedymd`) を現在日付で判定し、有効分のみ返却

### 13.7 患者別病名情報
- **`GET /orca/disease/import/{param}`**
  - ORCAアクセス媒体: ORCA DB (`tbl_ptnum`, `tbl_ptbyomei`)
  - 主な入力: `param = "{patientId},{fromYYYYMMDD},{toYYYYMMDD},{ascend}"`
  - 取得情報: 指定期間の診療病名履歴（`startDate`, `diagnosisCode`, `diagnosis`, `utagaiflg`, `syubyoflg`, `tenkikbn`, `endDate`, `sryka`）
  - レスポンス形式: `RegisteredDiagnosisList` JSON
  - 補足: `tbl_ptnum` で `patientId` から ORCA 内部 `ptid` を検索してから病名テーブルを参照
- **`GET /orca/disease/active/{param}`**
  - ORCAアクセス媒体: ORCA DB (`tbl_ptnum`, `tbl_ptbyomei`)
  - 主な入力: `param = "{patientId},{ascend}"`
  - 取得情報: 非削除 (`dltflg!='1'`) の最新病名一覧（開始日順／降順指定可）。`RegisteredDiagnosisModel` と同じフィールド構成

### 13.8 部門情報（WEB ORCA API）
- **`GET /orca/deptinfo`**
  - ORCAアクセス媒体: WEB ORCA API `system01lstv2`（`OrcaConnect.system01lstv2`）
  - 主な入力: なし（当日の日付をサーバー側で指定）
  - 取得情報: 診療科コード・名称・担当者情報等（XML を取得後、タグを除去してカンマ区切り文字列で返却）
  - 補足: 接続先ホスト/ポート/認証情報は `custom.properties` の `orca.orcaapi.*`／`orca.id`／`orca.password` を利用

## 14. サーバー REST API カタログ
- Web クライアントから電子カルテサーバーへ呼び出される REST エンドポイントと、主に授受される情報を整理する。
- すべてのリクエストは基本認証ヘッダー（`userName`, `password`=MD5, `clientUUID` など）を付与し、レスポンスは JSON（Jackson コンバータ）またはプレーンテキストで返却される。

### 14.1 認証・ユーザー管理（`UserResource`）
- **`GET /user/{userId}`**（レスポンス: `UserModel`）
  - ヘッダーの `userName` と同一 ID のみ取得可能。
  - ユーザー基本情報、施設情報、ロール一覧を返す。
- **`GET /user`**（レスポンス: `UserList`）
  - 管理者権限向け。施設内ユーザー一覧（氏名、ロール、状態）。
- **`POST /user`**, **`PUT /user`**（リクエスト: `UserModel`）
  - 新規作成／更新。ロールと施設 ID を含むモデルを送信し、結果件数を文字列で返却。
- **`DELETE /user/{userId}`**
  - 管理者用。指定ユーザーを削除。
- **`PUT /user/facility`**（リクエスト: `UserModel`）
  - 施設情報（住所・連絡先など）を更新。
- **`GET /user/name/{userId}`**（レスポンス: 氏名テキスト）
  - 画面表示用の簡易参照。

### 14.2 サーバー・ライセンス情報（`ServerInfoResource`, `SystemResource`）
- **`GET /serverinfo/jamri`**, **`GET /serverinfo/claim/conn`**, **`GET /serverinfo/cloud/zero`**
  - `custom.properties` から取得した JMARI コード、CLAIM 接続種別、クラウド設定をテキストで返却。
- **`GET /dolphin`**
  - 動作確認用メッセージ（`Hellow, Dolphin`）。
- **`POST /dolphin`**（リクエスト: 管理者 `UserModel`）
  - 施設管理者作成。戻り値は `facilityId:userId`。
- **`GET /dolphin/activity/{year,month,count}`**（レスポンス: `ActivityModel` 配列）
  - 月次 API 呼び出し・カルテ操作回数等の集計。
- **`POST /dolphin/license`**（リクエスト: UID テキスト）
  - ライセンス利用枠判定結果（`0`=許可等）。

### 14.3 患者検索・登録（`PatientResource`）
- **`GET /patient/name|kana|digit/{query}`**（レスポンス: `PatientList`）
  - 氏名・カナ・索引コード検索。患者基本情報、最終来院日、保険情報サマリを返却。
- **`GET /patient/id/{patientId}`**（レスポンス: `PatientModel`）
  - 患者詳細（住所、連絡先、健康保険、メモ）。
- **`GET /patient/pvt/{date}`**（レスポンス: `PatientList`）
  - 指定日受付がある患者一覧。
- **`GET /patient/documents/status`**（レスポンス: `PatientList`）
  - 仮保存カルテを持つ患者リスト。
- **`POST /patient`**, **`PUT /patient`**（リクエスト: `PatientModel`）
  - 新規登録／更新。応答は登録 PK または更新件数（文字列）。
- **`GET /patient/count/{prefix}`**（レスポンス: 数値文字列）
  - `prefix` に一致する患者件数（1000件超過判定等で利用）。
- **`GET /patient/all`**（レスポンス: `PatientList`）
  - 施設内患者を全件取得。小規模施設向けの初期ロードに利用。
- **`GET /patient/custom/{condition}`**（レスポンス: `PatientList`）
  - カスタム条件（例えば傷病名）で患者を抽出。画面上の高度フィルタリングに対応。

### 14.4 受付・スケジュール（`PVTResource`, `PVTResource2`, `ScheduleResource`, `AppoResource`）
- **`GET /pvt/{params}`**（レスポンス: `PatientVisitList`）
  - 担当医別／日付別受付一覧。患者基本情報、受付状態、メモ、保険情報を返却。
- **`POST /pvt`**, **`POST /pvt2`**（リクエスト: `PatientVisitModel`）
  - 受付登録。患者モデル・保険モデルを含む JSON を送信。
- **`PUT /pvt/{pvtPK,state}`**, **`PUT /pvt/memo/{pvtPK,memo}`**
  - 受付ステータス更新、受付メモ更新。
- **`DELETE /pvt/{pvtPK}`**, **`DELETE /pvt2/{pvtPK}`**
  - 受付削除（`/pvt2` は施設 ID を考慮）。
- **`GET /pvt2/pvtList`**（レスポンス: `PatientVisitList`）
  - ロングポーリング用に蓄積された最新受付のまとめ取得。
- **`GET /schedule/pvt/{params}`**（レスポンス: `PatientVisitList`）
  - 予定カルテ向け受付一覧。医師／未割当フラグでフィルタリング。
- **`POST /schedule/document`**（リクエスト: `PostSchedule`）
  - 予定カルテ生成＋CLAIM 送信トリガー。戻り値は処理件数。
- **`DELETE /schedule/pvt/{pvtPK,patientPK,date}`**
  - 予定カルテの削除。
- **`PUT /appo`**（リクエスト: `AppoList`）
  - 予約情報一括登録（受付連携用）。

### 14.5 カルテ・文書管理（`KarteResource`）
- **`GET /karte/pid/{patientId,fromDate}`**, **`GET /karte/{patientPK,fromDate}`**（レスポンス: `KarteBean`）
  - 指定患者のカルテ全体（文書一覧、モジュール、観察値サマリ）。`fromDate` で取得期間を制限。
- **`GET /karte/docinfo/{karteId,fromDate,includeModified}`**（レスポンス: `DocInfoList`）
  - 文書メタ情報（タイトル、作成日、状態、CLAIM 送信可否）。
- **`GET /karte/documents/{docId,...}`**（レスポンス: `DocumentList`）
  - ドキュメント本体。添付ファイルのバイナリは除外。
- **`POST /karte/document`**, **`PUT /karte/document`**（リクエスト: `DocumentModel`）
  - カルテ保存／更新。モジュール・スタンプ・シェーマとの関連付けを含む JSON。
- **`PUT /karte/document/{docId}`**（リクエスト: タイトル文字列）
  - ドキュメント表題の更新。
- **`DELETE /karte/document/{docId}`**（レスポンス: `StringList`）
  - 削除済みドキュメント ID を返却。
- **`GET /karte/modules/{params}`**, **`GET /karte/moduleSearch/{params}`**（レスポンス: `ModuleList` 系）
  - 文書内モジュール／スタンプ検索。エンティティ種別や日付でフィルタ。
- **`GET /karte/diagnosis/{params}`**, **`POST|PUT /karte/diagnosis`**, **`DELETE /karte/diagnosis/{params}`**
  - 傷病名の取得・登録・削除。レスポンスは `RegisteredDiagnosisList`。
- **`GET /karte/observations/{params}`**, **`POST|PUT /karte/observations`**, **`DELETE /karte/observations/{params}`**
  - バイタル・検査値（`ObservationModel`）の CRUD。
- **`GET /karte/attachment/{attachmentId}`**, **`GET /karte/image/{schemaId}`**
  - 添付 PDF やシェーマ画像を個別取得。
- **`GET /karte/memo`**, **`POST /karte/memo`** など
  - 患者メモ、自由診療文書（`/freedocument`）、CLAIM 再送（`/claim`）等の補助 API も同リソースに集約。

### 14.6 スタンプ・テンプレート（`StampResource`）
- **`GET /stamp/tree/{userPK}`**（レスポンス: `StampTreeHolder`）
  - 利用者のスタンプツリー（フォルダ構造、各スタンプメタ）。
- **`PUT /stamp/tree`**, **`PUT /stamp/tree/sync`**, **`PUT /stamp/tree/forcesync`**（リクエスト: `StampTreeModel`）
  - ツリー登録・同期。戻り値は PK あるいはバージョン文字列。
- **`GET /stamp/published/tree`**, **`PUT /stamp/published/tree`**, **`PUT /stamp/published/cancel`**
  - 公開スタンプセットの取得・更新・取消し。レスポンスは `PublishedTreeList`、文字列等。
- **`PUT /stamp/subscribed/tree`**, **`DELETE /stamp/subscribed/tree/{ids}`**
  - 公開スタンプ購読設定。
- **`GET /stamp/id/{id}`**, **`GET /stamp/list/{ids}`**（レスポンス: `StampModel` / `StampList`）
  - 個別スタンプの取得。スタンプ内容（モジュール、ClaimItem）を含む。
- **`POST /stamp/id`**, **`POST /stamp/list`**, **`DELETE /stamp/id/{id}`** 等
  - スタンプの追加・削除（ユーザー個別のスタンプ管理）。

### 14.7 ラボ・検査（`NLabResource`）
- **`GET /lab/module/{patientId,first,max}`**（レスポンス: `NLaboModuleList`）
  - 検査セット（検査日、検査名、コメント、結果項目）。
- **`GET /lab/module/count/{patientId}`**（レスポンス: 件数文字列）
  - 指定患者の検査履歴件数。
- **`GET /lab/item/{patientId,first,max,itemCode}`**（レスポンス: `NLaboItemList`）
  - 項目コード単位の検査推移。
- **`GET /lab/patient/{id,id,...}`**（レスポンス: `PatientLiteList`）
  - 指定患者 ID 群の情報を簡易取得（検査ビューワ向け）。
- **`POST /lab/module`**（リクエスト: `NLaboModule`）
  - 検査結果の取り込み。登録後は患者モデルを返却。
- **`DELETE /lab/module/{moduleId}`**
  - 検査データ削除。

### 14.8 リアルタイム通知・排他管理（`ChartEventResource`）
- **`GET /chartEvent/subscribe`**
  - ロングポーリング。`clientUUID` ヘッダーと施設 ID を紐付け、非同期コンテキストに登録。
- **`PUT /chartEvent/event`**（リクエスト: `ChartEventModel`）
  - 排他状態やカルテ更新のイベントを投入。戻りは処理件数。
- **`GET /chartEvent/dispatch`**（レスポンス: `ChartEventModel`）
  - 受信側が subscribe 後に取得するイベント本体。UI ではロック表示・更新通知に使用。

### 14.9 文書・帳票（`LetterResource` ほか）
- **`PUT /odletter/letter`**（リクエスト: `LetterModule`）
  - 紹介状・診療情報提供書などの帳票保存。応答は PK 文字列。
- **`GET /odletter/list/{karteId}`**, **`GET /odletter/letter/{letterId}`**（レスポンス: `LetterModuleList`／`LetterModule`）
  - カルテ単位の帳票一覧、個別帳票の詳細。
- **`DELETE /odletter/letter/{letterId}`**
  - 帳票削除。
- （補足）カルテ PDF 生成や帳票ダウンロード API は `KarteResource` 内の `/attachment` 等を参照。

### 14.10 データエクスポート・MML（`MmlResource`）
- **`GET /mml/document|patient|disease|memo|observation/...`**
  - 施設内ドキュメント・患者・病名・メモ・観察値を MML/JSON 形式でダンプ。大規模移行やバックアップ用途。
- 応答は MML ファイル生成件数（テキスト）または各モデルの JSON（`IPatientModel`, `RegisteredDiagnosisModel` 等）。Web クライアントがデータ移行ツールを提供する場合に利用する。
