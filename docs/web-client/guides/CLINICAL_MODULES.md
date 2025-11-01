# 臨床・運用モジュールガイド

Web クライアントに実装済みの主要臨床モジュールと運用機能を 1 つのガイドに統合しました。患者管理、受付・予約、カルテ補助、ORCA 連携、帳票/シェーマなどの仕様・利用 API・運用上の注意点を以下に整理しています。個別の運用手順書は `docs/web-client/operations` を参照してください。

## 1. 患者情報編集 (`PatientsPage`)
- **画面位置**: `web-client/src/features/patients/pages/PatientsPage.tsx`。検索結果の詳細パネルに編集カードを追加。
- **主要 API**: `GET/POST/PUT /patient`, `GET /patient/name|kana|digit|id`, `GET /patient/documents/status`。
- **フォーム構成**:
  - 基本情報（ID・氏名・カナ・性別・生年月日）は必須。未入力時はバリデーションエラーを表示。
  - 連絡先・住所・メモ（患者メモ、アプリメモ、安全情報、家族メモ）を編集可能。履歴ダイアログで過去バージョンをプレビュー・復元し、復元操作は `recordOperationEvent` へ記録。
  - `reserve1〜reserve6` を横並びで保持し、院内独自項目の互換性を維持。
- **健康保険**:
  - 保険リストを行単位で編集。GUID、保険区分、保険者番号、記号番号、開始日/期限をフォーム入力。
  - 追加・削除操作は監査ログへ送出。保存時は `decode/encodeHealthInsuranceBean` で既存 Bean を再生成し、Swing 版と同じデータ構造を保持。
- **ユーザー影響**:
  - Swing クライアントと同じテーブル/Bean を更新するため移行作業は不要。Web 側での編集が増えることを想定し、保存確認フローを受付チームへ周知。
  - 保険項目が空でも保存可能だが、請求に必要な項目は従来どおり運用教育で補完する。

## 2. 受付・予約・サマリ運用
### 2.1 受付一覧と詳細ドロワ
- **画面位置**: `web-client/src/features/reception/pages/ReceptionPage.tsx`。
- **主要 API**: `GET /patient/pvt/{date}`, `GET /patient/documents/status`, `PUT /pvt/{pvtPK,state}`, `DELETE /pvt2/{pvtPK}`。
- **機能**:
  - カード表示/表形式を切り替え可能。表示カラム設定は端末ごとにローカル保存し、既存ユーザーの表示崩れを回避。
  - 「受付詳細」ドロワで患者基本情報、警告メモ、最近の来院履歴、仮保存カルテを表示。状態更新/受付取消モーダルは二重送信防止のため操作中にボタンを無効化。
  - バーコード受付は CODE39/128 を自動解釈し、`POST /pvt2` で受付登録。担当医・診療科・保険 UUID はフォームで保存し、ローカルストレージに記憶。
- **ユーザー影響**: 従来導線を維持しながら機能追加。取消は復元不可のため業務手順書に確認ステップを追加。表示設定は `opendolphin.reception.preferences.v1` で管理。

### 2.2 予約管理 (`AppointmentManager`)
- **主要 API**: `GET /karte/appo/{karteId,from,to}`, `PUT /appo`。
- **機能**:
  - 重複予約（1 分以内）を UI でブロック。保存後はキャッシュを失効させ、成功/失敗をインライン通知。
  - リマインダー送信はメール/SMS を想定し、送信記録を `/appo` PUT でメモへ追記。記録フォーマット: `【リマインダー】YYYY/MM/DD HH:mm メール(example)`。
  - 監査ログは `measureApiPerformance` + `recordOperationEvent` で収集。運用研修は `operations/RECEPTION_WEB_CLIENT_MANUAL.md` を参照。

### 2.3 施設予約一覧 (`FacilitySchedulePage`)
- **主要 API**: `GET /schedule/pvt/{date}`、必要時 `GET /schedule/pvt/{orcaId,unassignedId,date}`, `POST /schedule/document`, `DELETE /schedule/pvt/{pvtPK,ptPK,date}`。
- **機能**:
  - 日付・担当医・状態・キーワードでフィルタ。ORCA 担当医コードが未設定の場合は UI で案内。
  - 予約詳細ダイアログからカルテ生成と予約削除を同一 UI で提供。生成時は `sendClaim` チェックボックスでレセ電送信フラグを制御。
  - 取得結果は 30 秒キャッシュ。操作成功時は React Query キャッシュを失効し、監査ログへ `schedule.document.*` メトリクスを記録。
- **ユーザー影響**: Swing 版と同一エンドポイントを利用。予約削除は復元不可のため運用手順書で二重確認を義務化。

### 2.4 FreeDocument エディタ
- **主要 API**: `GET /karte/freedocument/{patientId}`, `PUT /karte/freedocument`。
- **機能**:
  - 保存後に自動再取得し、Swing と Web の内容を同期。`facilityPatId` を付与し、監査ログへ保存イベントを記録。
  - タイムスタンプを `YYYY-MM-DDTHH:mm:ss` 形式で送信し、UI に最新保存時刻を表示。
- **ユーザー影響**: Swing と共用。監査ログにより変更追跡が容易。

## 3. カルテ補助パネル
### 3.1 CareMap カレンダー
- **画面位置**: `web-client/src/features/charts/components/CareMapPanel.tsx`。
- **主要 API**: `/karte/appo`, `/karte/documents`, `/karte/attachment`, `/lab/module`。
- **機能**:
  - 月次カレンダーと日別タイムラインで予約・カルテ文書・検査・添付（画像/PDF）を俯瞰。種別フィルタ、前月/翌月ナビゲーションを提供。
  - `buildCareMapEvents` がイベントを正規化し、異常検査値は件数と代表 3 項目を表示。添付は画像プレビューまたはダウンロード導線を提示。
- **移行**: 旧 `image-browser.properties` の移行手順は `operations/CAREMAP_ATTACHMENT_MIGRATION.md` を参照。添付登録後は CareMap と右ペインギャラリーで表示を確認。

### 3.2 Lab 検査履歴ビューア
- **画面位置**: `web-client/src/features/charts/components/LabResultsPanel.tsx`。
- **主要 API**: `/lab/module/{patientId,first,max}`, `/lab/item/{patientId,first,max,itemCode}`。
- **機能**:
  - 最新 40 件の検査モジュールを取得し、項目名・値・単位・基準値・判定を表示。部分一致検索と推移グラフ（SVG）を提供。
  - 「PDF 出力」でブラウザ印刷ダイアログを起動し、Swing 版と同じ帳票フローに対応。
- **運用**: 追加の DB 移行は不要。標準ブラウザ（Chromium 系）で印刷動作を事前確認する。

## 4. スタンプと ORCA 連携
### 4.1 スタンプライブラリ
- `/stamp/tree/{userPK}` の `treeBytes` をデコードし、`StampLibraryPanel` でカテゴリ/検索/お気に入りを提供。お気に入りは `opd.web.stampFavorites.v1` に保存し、既存ユーザーのデータを維持。
- 「挿入」操作は診察ロック中のみ許可し、Plan テキストへ `スタンプ名 (entity) [フォルダ]` を追記。DocumentModel への自動展開はフェーズ 3 後半で検討。

### 4.2 ORCA マスター検索と禁忌チェック
- **主要 API**: `/orca/tensu/name|code`, `/orca/disease/name`, `/orca/general/{code}`, `/orca/interaction`。
- 診療行為検索は部分一致/前方一致を切り替え、既存処方と追加予定リストを保持。禁忌チェックは既存・追加コードを PUT し、重大/注意/参考に分類して表示。
- 傷病名は参照専用。一般名照会は医薬品スタンプ生成拡張を想定。

### 4.3 ORDER セットとテンプレート
- `OrderSetPanel` が診察記録、Plan カード、患者向け文書テンプレートを一括適用。ローカルストレージ `opd.web.orderSets.v1` に保存し、共有/インポートは JSON パッケージ（`order-set-sharing.ts`）で管理。
- Plan カードに `injection`・`guidance` 種別を追加し、将来の自動分類へ備える。

### 4.4 オーダーデータ要件
- すべての文書は `DocumentModel` と `DocInfoModel` の必須フィールド（`status`、`confirmed`、`docId`、`docType`、保険情報、CLAIM フラグ等）を網羅する。
- `ModuleModel` は `beanBytes` と `ModuleInfoBean.entity` を必須とし、`ClaimBundle`/`ClaimItem` に診療行為コード・数量・単位・区分 (`classCode`、`ykzKbn`) を正確に設定する。
- ORCA コードからカテゴリを導出し、`DocInfoModel.hasRp/hasTreatment/hasLaboTest` などのフラグを適切に更新。詳しくは `web-client/src/features/charts/api` と `web-client/scripts/order-entry` 系テストを参照。

## 5. 文書・シェーマ・テンプレート
- **診断書エディタ** (`ChartsPage` Supplement): `GET /odletter/list`, `GET /odletter/letter/{id}`, `PUT /odletter/letter` を利用。患者情報差し込み、HTML プレビュー → 印刷、保存後のキャッシュ失効、監査ログ出力を実装。`linkId` に旧 PK を渡して履歴を置換。
- **シェーマエディタ**: HTML5 Canvas で描画し、JPEG Base64 を `SchemaModel` として `POST /karte/document` に含め保存。保存は `schemaSave` として監査ログへ送出。患者未選択時は保存を無効化。
- **文書テンプレート** (`PatientDocumentsPanel`): 生活指導文・紹介状・予防接種同意書を提供。患者/施設情報を自動差し込み、プレビュー不可環境では HTML ダウンロードへフォールバック。
- **運用教育**: 研修では診断書の編集→PDF 出力、シェーマ描画→保存→CareMap 表示を必ず実演。最新手順は `operations/RECEPTION_WEB_CLIENT_MANUAL.md` に統合済み。

## 6. 既存ユーザーへの共通配慮
- すべてのモジュールで Swing クライアントと同じ REST API・データ形式を利用し、追加のデータ移行を不要とした。
- ローカルストレージを利用する機能（スタンプお気に入り、Order セット、受付表示設定、バーコード受付既定値）は既存キーを維持し、設定が失われないようにした。リセットが必要な場合のみキーを削除する運用とする。
- 監査ログは `recordOperationEvent` で一元出力し、既存監査と統合。新規導入機能は全て監査イベント名を明示しているため、セキュリティチームは `process/SECURITY_AND_QUALITY_IMPROVEMENTS.md` のリストを参照して運用ルールを更新できる。
