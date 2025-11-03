# REST APIインベントリ（Webクライアント向け）

- 作成日: 2025-10-29
- 参照元: `server/src/main/java/open/dolphin/rest`, `server/src/main/java/open/orca/rest`, `docs/web-client/requirements/WEB_CLIENT_REQUIREMENTS.md` 第14章
- 前提: すべてのリクエストで `userName` / `password(MD5)` / `clientUUID` ヘッダーを送出し、施設IDは WildFly の `RemoteUser` またはボディで補完する。
- ステータス凡例: ✅=利用可、🛠=実装時調整あり、⚠=追加検証が必須、🚫=Webクライアント非対応。
- 旧サーバー REST API の完全な一覧は [`../../server/LEGACY_REST_API_INVENTORY.md`](../../server/LEGACY_REST_API_INVENTORY.md) を参照。

## 1. 認証・ユーザー管理 (`UserResource`, `SystemResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | 備考 |
| --- | --- | --- | --- | --- | --- |
| UserResource | GET | `/user/{userId}` | ログイン後のユーザー/施設情報取得 | ✅ フェーズ1で必須 | ヘッダー `userName` と同一IDのみ許可。
| UserResource | GET | `/user` | 施設内ユーザー一覧 | 🛠 管理者向け画面で利用予定 | 管理者権限チェックあり。一般ユーザーUIでは非表示。
| UserResource | PUT | `/user` | プロファイル更新 | 🛠 自分自身のプロファイル編集で使用 | 権限チェック厳格。ロール変更は管理者のみ許可。
| UserResource | POST | `/user` | ユーザー作成 | ⚠ Web管理画面の要否未決 | 管理者権限必須、UI実装範囲を別途確定。
| UserResource | DELETE | `/user/{userId}` | ユーザー削除 | ⚠ 当面は既存コンソールに委譲 | 誤操作リスクが高いため Web UI は後続フェーズで検討。
| UserResource | GET | `/user/name/{userId}` | ユーザー表示名取得 | ✅ 各種一覧の表示補助に利用可 | 認証不要。キャッシュ方針を定める。
| UserResource | PUT | `/user/facility` | 施設情報更新 | ⚠ 運用導入初期のみ使用想定 | CI/CD 管理者経由の運用設計が必要。
| SystemResource | GET | `/dolphin/activity/{param}` | サーバー活動ログ取得 | ⚠ 監査ログUIの要否検討 | `param`=期間/施設、レスポンス大。パフォーマンス検証必要。
| SystemResource | POST | `/dolphin` | 施設管理者アカウント登録 | ⚠ 運用チーム専用 | Web UI での露出は予定なし。登録結果の管理と監査が必要。
| SystemResource | POST | `/dolphin/license` | CloudZero ライセンス登録/検証 | 🛠 システム設定画面で参照 | `0`=成功、`2`〜`4`=異常。書き込み系のため保護要。
| SystemResource | GET | `/dolphin/cloudzero/sendmail` | 月次 CloudZero メール送信 | ⚠ バッチ代替導線の検討 | 現状はサーバーログへの記録のみ。手動実行は要注意。
| ServerInfoResource | GET | `/serverinfo/*` | サーバー設定取得 | ✅ 初期設定画面で参照 | `jamri` / `claim/conn` / `cloud/zero` の3種。`custom.properties` を読み込む。

## 2. 患者・受付 (`PatientResource`, `PVTResource`, `ScheduleResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | 備考 |
| --- | --- | --- | --- | --- | --- |
| PatientResource | GET | `/patient/name/{name}` | 漢字氏名検索 | ✅ 患者検索UI基本機能 | limit 取得無し。結果数>1000の場合 `/patient/count` を併用。
| PatientResource | GET | `/patient/kana/{kana}` | カナ検索 | ✅ 検索タブで使用 | 全角カナ想定。入力補助要検討。
| PatientResource | GET | `/patient/digit/{digit}` | 生年月日/電話番号等の数字検索 | ✅ ショートカット検索に利用 | 施設IDでフィルタ済。
| PatientResource | GET | `/patient/id/{pid}` | 患者ID直接取得 | ✅ 詳細画面遷移 | 受付リストや外部連携から利用。
| PatientResource | GET | `/patient/pvt/{yyyymmdd}` | 日次来院者取得 | 🛠 受付リスト表示 | 表示範囲/ページング未実装。
| PatientResource | GET | `/patient/documents/status` | 仮保存カルテの患者一覧 | ✅ 下書き管理に活用 | 応答量多い場合はlazy load検討。
| PatientResource | POST/PUT | `/patient` | 新規患者登録/更新 | ✅ Web 編集フォーム経由で実装済み | `PatientsPage` からの登録/更新で健康保険 Bean 再生成と監査ログ送信を実施。
| PatientResource | GET | `/patient/count/{name}` | 検索件数確認 | 🛠 UX最適化用 | 1000件超過時のみ使用。
| PatientResource | GET | `/patient/all` | 全患者リスト取得 | ⚠ 大量データの扱いを検討 | 管理ツールのみで使用。ページング未実装。
| PatientResource | GET | `/patient/custom/{param}` | カスタム検索 | ⚠ 要件ヒアリング中 | 傷病名や自由条件検索を想定。レスポンス増加に注意。
| PVTResource | GET | `/pvt/{param}` | 受付リスト/状態取得 | ✅ 受付リスト初期表示 | `param`=`fid,yyyymmdd,states` 形式。
| PVTResource | POST | `/pvt` | 受付登録 | ✅ 受付ダイアログから利用 | 保険情報の親参照をサーバー側で補完。 |
| PVTResource | PUT | `/pvt/{param}` | 受付状態更新 | ✅ 診察開始/終了のトグル | 業務フローと同期必須。
| PVTResource | PUT | `/pvt/memo/{param}` | 受付メモ更新 | 🛠 受付UIから利用 | `param`=`pvtPK,memo` エンコード要注意。
| PVTResource | DELETE | `/pvt/{pvtPK}` | 受付削除 | ⚠ 監査要件確認後に UI 解放 | 現行運用では管理者のみ。
| PVTResource2 | POST | `/pvt2` | 受付登録（拡張版） | ✅ VisitManagementDialog で利用 | 施設 ID を自動付与。保険情報を正規化。
| PVTResource2 | DELETE | `/pvt2/{pvtPK}` | 受付削除 | ⚠ 担当者のみ操作 | ChartEvent 更新と整合を要確認。
| PVTResource2 | GET | `/pvt2/pvtList` | ロングポーリング用受付一覧 | ✅ ChartsPage のステータス更新 | MSW モックで遅延・切断を再現済み。
| ScheduleResource | GET | `/schedule/pvt/{param}` | 予約/受付一覧取得 | 🛠 カレンダーと連携 | `param`=`fid,yyyymmdd`。レスポンスは `PatientVisitList`。
| ScheduleResource | POST | `/schedule/document` | 診療履歴作成（予約経由） | ⚠ 旧クライアント依存ロジック | 詳細仕様確認中。
| ScheduleResource | DELETE | `/schedule/pvt/{param}` | 予約削除 | ⚠ 予約管理UI要件次第 | 権限ガードに注意。
| AppoResource | PUT | `/appo` | 予約一括更新 | ⚠ 運用設計が未確定 | UI では段階導入を検討。成功時は更新件数のみ返却。

## 3. カルテ主機能 (`KarteResource`, `AppoResource`, `LetterResource`, `MmlResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | 備考 |
| --- | --- | --- | --- | --- | --- |
| KarteResource | GET | `/karte/pid/{pid,from}` | 患者IDベースでカルテ取得 | ✅ カルテ画面初期ロード | `from`=YYYYMMDD。施設IDは server 側解決。
| KarteResource | GET | `/karte/{patientPk,from}` | PKベースカルテ取得 | 🛠 内部再読み込み用 | PKキャッシュ方針要検討。
| KarteResource | GET | `/karte/docinfo/{karteId,from,includeModified}` | 文書メタ一覧取得 | ✅ タイムライン表示 | includeModified=`true/false`。
| KarteResource | GET | `/karte/documents/{docIds}` | 文書詳細取得 | ✅ 画面表示 | 複数IDカンマ区切り。添付ファイルは null 化済み。
| KarteResource | POST | `/karte/document` | カルテ保存 | ✅ フェーズ2の中心機能 | `DocumentModel` JSONで送信。
| KarteResource | POST | `/karte/document/pvt/{pvtPK,state}` | 受付紐付け保存 | ✅ 受付完結フローで使用 | `state`=受付状態更新値。
| KarteResource | PUT | `/karte/document` | カルテ更新 | 🛠 既存クライアント互換 | 実装有無を調査中。
| KarteResource | GET | `/karte/claim` | CLAIM送信トリガー | ⚠ 自費対応検証後 | ORCA連携タイミング要整理。
| KarteResource | GET | `/karte/diagnosis/{param}` | 病名取得・更新 | ✅ A/P と連携 | `/diagnosis` 系は CRUD を提供。
| KarteResource | GET | `/karte/observations/{param}` | 観察値取得 | 🛠 バイタル表示に活用 | `param`=`patientId,from,to`。
| KarteResource | GET | `/karte/attachment/{docId}` | 添付取得 | 🛠 画像/ファイルプレビュー | 大容量対策が必要。
| KarteResource | GET | `/karte/moduleSearch/{query}` | モジュール検索 | ⚠ UI要件ヒアリング中 | 既存スタンプ検索との住み分け要。
| KarteResource | GET | `/karte/docinfo/all/{param}` | 全文書取得 | 🚫 レガシー互換のみ | 応答サイズが大きすぎるため利用不可。
| NLabResource | GET | `/lab/module/{pid,first,max}` | ラボ結果取得 | ✅ ラボビューの基礎データ | 期間・件数パラメータで絞り込み。詳細は `/lab/item/*` で取得。
| AppoResource | PUT | `/appo` | 予約一括更新 | ⚠ UI への露出検討中 | モバイル連携を想定。戻り値は更新件数のみ。
| LetterResource | GET | `/letter/{param}` | 紹介状など文書取得 | 🛠 文書出力機能で使用 | Belforフォーマット対応要確認。
| MmlResource | GET | `/mml/{param}` | MML文書出力 | ⚠ 互換性検証中 | 文字コード/encoding 要注意。

## 4. リアルタイム・ロングポーリング (`ChartEventResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | 備考 |
| --- | --- | --- | --- | --- | --- |
| ChartEventResource | GET | `/chartEvent/subscribe` | 長輪講サブスクライブ | ✅ 既存ロングポーリングの再利用 | タイムアウト/再接続戦略をクライアント側で再設計。
| ChartEventResource | PUT | `/chartEvent/event` | イベント送信 | ✅ カルテ更新通知 | 署名/保存時に publish。
| ChartEventResource | GET | `/chartEvent/dispatch` | イベントディスパッチ | ⚠ 使われていない可能性 | 用途調査の上、必要なら新実装へ移行。

## 5. スタンプ・テンプレート (`StampResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | 備考 |
| --- | --- | --- | --- | --- | --- |
| StampResource | GET | `/stamp/tree/{userPK}` | 個人スタンプツリー取得 | ✅ ワークスペースで使用 | 応答は `StampTreeHolder`。Lazyロードとキャッシュ要検討。
| StampResource | POST | `/stamp/tree` | スタンプツリー更新 | ✅ フロントのスタンプ編集で利用 | JSON構造保持が必須。
| StampResource | POST | `/stamp/tree/sync` | ツリー同期 | 🛠 既存クライアント互換API | Webクライアントで利用する場合は UX 再設計。
| StampResource | GET | `/stamp/published/tree` | 公開スタンプ取得 | ✅ 共通スタンプに利用 | キャッシュTTLを検討。
| StampResource | GET | `/stamp/list/{entity}` | スタンプリスト取得 | ✅ スタンプ検索 | `entity`=診療科/カテゴリ。レスポンスは `StampList`。
| StampResource | POST | `/stamp/list` | スタンプリスト登録 | ⚠ 権限設計次第 | 共有スタンプ作成に管理者承認必須。
| StampResource | DELETE | `/stamp/id/{uuid}` | スタンプ削除 | ⚠ 権限と監査ログ要件を整理 | 誤削除対策として二段階確認を設計予定。

## 6. ORCA 連携 (`OrcaResource`)

| リソース | HTTP | パス | 主用途 | Webクライアント利用方針 | 備考 |
| --- | --- | --- | --- | --- | --- |
| OrcaResource | GET | `/orca/facilitycode` | 施設コード取得 | 🛠 ORCA接続テスト | 起動時チェックに利用。
| OrcaResource | GET | `/orca/tensu/name/{query}/` | 点数マスター（名称検索） | ✅ オーダ検索の基本 | 引数末尾 `/` 必須。日付パラメータ同梱形式。
| OrcaResource | GET | `/orca/tensu/code/{query}/` | 点数コード検索 | ✅ コード直接入力 | クライアント側でパラメータ整形。
| OrcaResource | GET | `/orca/tensu/ten/{param}/` | 点数値検索 | 🛠 コストフィルタリング | 用途限定。UIでの露出は要検討。
| OrcaResource | GET | `/orca/disease/name/{param}/` | 病名マスター検索 | ✅ 病名入力支援 | 併用で `partialMatch` 指定可。
| OrcaResource | GET | `/orca/disease/import/{param}` | ORCA病名履歴取得 | 🛠 病名参照 | 大量データ時のパフォーマンス要確認。
| OrcaResource | GET | `/orca/disease/active/{param}` | 現在病名取得 | ✅ 初期病名同期 | `param`=`patientId,ascend`。
| OrcaResource | PUT | `/orca/interaction` | 併用禁忌チェック | ✅ 処方チェック | JSONボディに `codes1/codes2`。
| OrcaResource | GET | `/orca/general/{srycd}` | 一般名取得 | ✅ 処方パネル補助 | 処方候補表示に利用。
| OrcaResource | GET | `/orca/inputset` | ORCA入力セット一覧 | ✅ スタンプセット生成 | 初回ロードはキャッシュ。
| OrcaResource | GET | `/orca/stamp/{param}` | 入力セット展開 | ✅ ORCAセット→スタンプ化 | レスポンスは `ModuleModel`。
| OrcaResource | GET | `/orca/deptinfo` | 診療科情報取得 | 🛠 初期設定UIで参照 | 接続設定エラーハンドリングが必要。

## 7. 長寿命トピック & 調査課題

- `/karte/moduleSearch/{query}` と `/stamp/tree/sync` は旧クライアント向け設計が色濃いため、Web UI での利用可否を追加調査する。
- `/schedule/document` などスケジュール関連の書き込み系 API は運用フローの承認を得てから UI に取り込む。
- ORCA 呼び出し系はタイムアウトが 5秒を超えるケースがあり、リトライとキャンセル制御を HTTP クライアントレイヤで標準化する。
- 今後 API バージョニングや GraphQL 化など拡張が必要になった場合は、本インベントリをベースに変更履歴を管理する。

