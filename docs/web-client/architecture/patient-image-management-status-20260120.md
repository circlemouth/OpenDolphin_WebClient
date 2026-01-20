# 患者画像管理（アップロード／カメラ／カルテ貼付）実装状況と必要作業
- RUN_ID: 20260120T105603Z
- 目的: 患者ごとに画像をアップロードまたはカメラ撮影で登録し、管理・閲覧・カルテ欄への貼り付けを実現するための現状確認と実装タスク整理。

## 1. 現状サマリ（2026-01-20 時点）
- Webクライアント実装は **未着手**。`web-client/src` にファイル入力（`type="file"`）や `getUserMedia` 利用箇所は存在せず、画像関連のコンポーネント・API モジュール・MSW ハンドラも見当たらない（`rg "type=\"file\"" web-client/src` / `rg "getUserMedia" web-client/src` がヒットなし）。
- HTTP 通過許可リスト (`web-client/src/libs/http/httpClient.ts`) に `/karte/*` 画像・添付系エンドポイントが未登録。既存画面（Charts/Patients/Reception）でも画像の取得・表示・貼付処理は呼ばれていない。
- サーバー（server-modernized）には **参照系のみ** が存在。
  - 画像一覧: `GET /karte/iamges/{karteId,from,to,...}`（typo “iamges” のまま、XML Plist 応答）
  - 単一画像: `GET /karte/image/{id}`（JSON `SchemaModelConverter` 応答）
  - 添付参照: `GET /karte/attachment/{id}`
  - 文書保存: `POST /karte/document` / `PUT /karte/document` が `DocumentModel` 経由で `schema` / `attachment` を受け取れるが、フロントからの送信実績はなし。
- ギャップ・リスク
  - 画像一覧のパスが `images` ではなく `iamges` のまま（API インベントリも同表記）。フロント実装時に 404/500 へ注意。
  - 画像/添付の **アップロード専用 API が存在しない**。`DocumentModel` への埋め込みで代替する想定だが、サイズ制限・S3/DB 二重ライトなどサーバー側の運用要件確認が必要。
  - MSW モックに `/karte/images` 系が未定義のため、UI 追加時は開発環境で即 404 となる。
- 参考ドキュメント
  - `docs/web-client/architecture/future-web-client-design.md` に「右固定メニューへ画像登録」方針記載のみで具体仕様は未定。
  - `docs/web-client/ux/charts-claim-ui-policy.md` に「画像（DICOM）履歴＋ビューア／カルテ貼付」方針があるが、実装・API 紐付けは未着手。

## 2. 実装に必要な主タスク
### 2.1 API/データフロー整備
- `httpClient` に画像・添付系パスを追加し、`runId`/`traceId`/`dataSourceTransition` を伝搬。
- 画像一覧/詳細の API クライアントを新規作成（typo パス対応含む）。サーバー側で `images` 正式パスが無いことを前提に、暫定で `iamges` を呼ぶか、サーバー修正を別タスクとして切り出す。
- アップロード経路を決定:
  - 案A: `DocumentModel` へ `attachment` として `bytes` Base64 埋め込みで `POST /karte/document`。
  - 案B: `SchemaModel` を画像専用として送り、サーバーで `schema` 保存。
  - いずれも `fileName` / `contentType` / `contentSize` / `digest` / `memo` を付与し、サーバーの S3/DB 兼用ストレージポリシーに合わせる。
- 削除・更新 API の有無を確認し、無ければ UI 側は「新規追加のみ + 参照」に限定するか、サーバー改修要求を別途起票。

### 2.2 UI/UX（患者別画像ライブラリ）
- 配置: Charts 右固定メニューに「画像」タブを追加し、患者単位のライブラリを表示（Reception/Patiens からの参照導線も検討）。
- 機能: サムネイル一覧（ページング/ソート）、メタ表示（撮影/アップロード日時・登録者・メモ・種別）、フィルタ（撮影方法/カテゴリ）。
- ビューア: モーダルまたは右パネルで拡大表示・回転・ダウンロード・コピー。
- カメラ撮影: `MediaDevices.getUserMedia` でカメラを起動し静止画を取得。HTTPS/localhost 以外での権限失敗ハンドリング、デバイス未接続時のフォールバック（ファイルアップロード誘導）を実装。
- アップロード: ドロップゾーン＋ファイル選択。複数同時アップロード、進捗表示、最大サイズ/拡張子バリデーションを行い、失敗時は再試行・破棄を提供。

### 2.3 カルテ貼付連携
- 画像を SOAP/フリー記載欄へ挿入する挙動を定義（例: 本文にプレースホルダ文字列＋閲覧用リンク、もしくは Document 保存時に `attachment` を紐付けて差分保存）。
- Document 保存フローとの統合: 既存 `DocumentCreatePanel`/`SoapNotePanel` へ添付IDリストを渡し、保存時に DocumentModel へ含める。
- 貼付ログ/監査: `action=chart_image_attach` のような auditEvent を追加し、`patientId`/`documentId`/`attachmentId`/`runId` を記録。

### 2.4 観測性・アクセシビリティ
- バナー/トーストに `aria-live` を設定（成功=polite, 失敗=assertive）。
- 画像取得・アップロードの latency/失敗を telemetry へ送信（`traceId`/`runId`/`contentSize`/`endpoint`）。
- セキュリティ: クリップボード貼付時は MIME を検査し、Exif GPS などのメタ情報削除ポリシーを決定。

### 2.5 テスト/モック
- MSW に `/karte/iamges` `/karte/image/{id}` `/karte/document` 添付付きリクエストのハンドラを追加（正常/4xx/5xx）。
- 単体テスト: カメラ取得のモック、ファイルバリデーション、貼付トークン挿入ロジック、API 呼び出しエラー時のガード。
- E2E: 画像アップロード→一覧反映→貼付→Document 保存までの happy/エラー系シナリオを追加。

## 3. 未解決事項・依存タスク
- サーバー側の正式パスを `images` に修正するか、フロント側で `iamges` を許容するかの決定。
- アップロード専用 REST が無い点をどう扱うか（Document 経由で十分か、専用 API を追加するか）。サーバー改修が必要な場合は別チケット化。
- 最大ファイルサイズ・対応フォーマット（静止画のみか、動画も許容か）の運用ポリシー。
- S3 モード/DB モード切替時の動作確認と監査要件（`AttachmentStorageManager` 二重アップロード解消パッチが前提となる）。

## 4. 次アクション（フロント側）
1) API クライアント雛形と MSW プレースホルダを追加し、画面から 200 応答を受け取れる状態を作る。
2) 右固定メニューに簡易「画像」パネルを追加し、ダミー一覧＋アップロード入力を表示（UI 骨格のみ）。
3) カメラ撮影とファイル選択の共通アップロードユーティリティを作成し、Document 保存フローへ添付 ID を渡す設計を具体化。
4) サーバー側パス/アップロード方式の決定が必要な項目をマネージャーへエスカレーション。

