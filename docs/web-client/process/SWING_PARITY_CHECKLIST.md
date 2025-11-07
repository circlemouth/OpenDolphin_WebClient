# Web クライアントとオンプレクライアント機能差分（コードベース）

- 2026-05-27: コードリーディング結果に基づき一覧を再構成。ドメイン別に主要クラスと実装状況を整理し、未移植領域を明示した。

## 1. コードベース比較サマリ
| ドメイン | オンプレ主要コード | Web主要コード | 実装状況 | 備考 |
| --- | --- | --- | --- | --- |
| 認証・ユーザー管理 | `client/src/main/java/open/dolphin/impl/login/LoginDialog.java`<br>`client/src/main/java/open/dolphin/delegater/UserDelegater.java`<br>`client/src/main/java/open/dolphin/impl/profile/AddUserImpl.java` | `web-client/src/libs/auth/auth-service.ts`<br>`web-client/src/features/administration/api/user-api.ts`<br>`web-client/src/features/administration/pages/UserAdministrationPage.tsx` | 同等＋監査強化 | MD5ハッシュ・監査ログを追加し、Swing 管理ツールの CRUD を React へ移植。 |
| システム設定・ライセンス | `client/src/main/java/open/dolphin/impl/profile/AddUserImpl.java`<br>`client/src/main/java/open/dolphin/delegater/ServerInfoDelegater.java`<br>`client/src/main/java/open/dolphin/delegater/UserDelegater.java` | `web-client/src/features/administration/api/system-api.ts`<br>`web-client/src/features/administration/pages/SystemPreferencesPage.tsx` | 同等 | JMARI/CLAIM/CloudZero 取得と `/dolphin/activity`・`/dolphin/license` を再実装。基礎設定の CRUD は今後。 |
| 患者検索・基本情報 | `client/src/main/java/open/dolphin/delegater/PatientDelegater.java`<br>`client/src/main/java/open/dolphin/impl/psearch/PatientSearchImpl.java` | `web-client/src/features/patients/api/patient-api.ts`<br>`web-client/src/features/patients/pages/PatientsPage.tsx` | 同等（一部未移植） | name/kana/id/digit 検索と CRUD は同等。`/patient/all`・`/patient/custom` 等は Web 未提供。 |
| 受付・来院管理 | `client/src/main/java/open/dolphin/delegater/PVTDelegater.java`<br>`client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java` | `web-client/src/features/reception/api/visit-api.ts`<br>`web-client/src/features/reception/api/visit-detail-api.ts`<br>`web-client/src/features/reception/pages/ReceptionPage.tsx` | 同等＋旧API併用 | `/pvt2` 登録・取消と `/pvt` 旧API を `VisitManagementDialog` で併存。バーコード受付も移植済み。 |
| 予約・施設スケジュール | `client/src/main/java/open/dolphin/delegater/ScheduleDelegater.java`<br>`client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java` | `web-client/src/features/schedule/api/facility-schedule-api.ts`<br>`web-client/src/features/reception/api/appointment-api.ts`<br>`web-client/src/features/schedule/pages/FacilitySchedulePage.tsx` | 同等 | `/schedule/pvt` 系と `/schedule/document`、`PUT /appo` を React ダイアログで提供。 |
| カルテ・文書タイムライン | `client/src/main/java/open/dolphin/delegater/DocumentDelegater.java`<br>`client/src/main/java/open/dolphin/client/KarteEditor.java`<br>`client/src/main/java/open/dolphin/client/DocumentHistory.java` | `web-client/src/features/charts/api/document-api.ts`<br>`web-client/src/features/charts/api/progress-note-api.ts`<br>`web-client/src/features/charts/components/DocumentTimelinePanel.tsx` | 同等＋UI拡張 | `/karte/documents` 取得と `/karte/document` 保存/更新、CareMap・添付表示を単画面化。 |
| 検査・ラボ | `client/src/main/java/open/dolphin/delegater/LaboDelegater.java`<br>`client/src/main/java/open/dolphin/impl/lbtest/LaboTestPanel.java` | `web-client/src/features/charts/api/labo-api.ts`<br>`web-client/src/features/charts/components/LabResultsPanel.tsx` | 同等 | `/lab/module`・`/lab/item` を取得し、推移グラフ・PDF 印刷相当を提供。 |
| 診断書・シェーマ | `client/src/main/java/open/dolphin/letter/MedicalCertificateImpl.java`<br>`client/src/main/java/open/dolphin/impl/schema/SchemaEditorImpl.java` | `web-client/src/features/charts/components/MedicalCertificatesPanel.tsx`<br>`web-client/src/features/charts/components/SchemaEditorPanel.tsx`<br>`web-client/src/features/charts/api/letter-api.ts` | 同等 | `/odletter/*` と `/karte/document` を React 補助パネルに集約。PDF/印刷フローも再現。 |
| スタンプ管理 | `client/src/main/java/open/dolphin/delegater/StampDelegater.java`<br>`client/src/main/java/open/dolphin/client/StampHolder.java` | `web-client/src/features/charts/api/stamp-api.ts`<br>`web-client/src/features/charts/components/StampLibraryPanel.tsx` | 取得のみ | スタンプ閲覧・抽出は移植済み。`PUT /stamp/tree` や公開/削除 API の UI は未実装。 |
| PHR・Masuda 拡張 | `client/src/main/java/open/dolphin/delegater/PHRDelegater.java`<br>`client/src/main/java/open/dolphin/delegater/MasudaDelegater.java`<br>`client/src/main/java/open/dolphin/impl/care/CareMapDocument.java` | `web-client/src/features/charts/components/CareMapPanel.tsx`<br>`web-client/src/features/charts/api/attachment-api.ts` | 部分移植 | CareMap と添付統合は完了。routineMed・rpHistory・`/20/adm/phr/*` は Web 未対応。 |

## 2. ドメイン別詳細

### 2.1 認証・ユーザー管理
- オンプレ: `client/src/main/java/open/dolphin/delegater/UserDelegater.java` が `/user` CRUD と `/user/facility` 更新、`/hiuchi/*` 系を提供し、`client/src/main/java/open/dolphin/impl/login/LoginDialog.java` と `client/src/main/java/open/dolphin/impl/profile/AddUserImpl.java` から呼び出している。
- Web: `web-client/src/libs/auth/auth-service.ts` の `loginWithPassword` が `/user/{facilityId:userId}` を直接叩き、`web-client/src/features/administration/api/user-api.ts` と `.../pages/UserAdministrationPage.tsx` が CRUD・ロール設定・施設更新を提供。
- 差分: Web 版は `hashPasswordMd5` でクライアント側ハッシュ化し、全操作で `measureApiPerformance` / `recordOperationEvent` を送出。Swing 版にある CSV 一括登録は未移植で `planning/UNIMPLEMENTED_API_UI_PLACEMENT.md` の検討対象。

### 2.2 システム設定・ライセンス
- オンプレ: `AddUserImpl` の施設タブと `client/src/main/java/open/dolphin/delegater/ServerInfoDelegater.java`、`UserDelegater#checkLicense` が `/serverinfo/*`・`/dolphin/activity`・`/dolphin/license` を利用。
- Web: `web-client/src/features/administration/api/system-api.ts` と `.../pages/SystemPreferencesPage.tsx` が同 API を取得し、Cloud Zero メール送信やアクティビティ統計を SurfaceCard で表示。
- 差分: Web 版は監査ログ記録と UI タブ化により運用時の可視性を向上。`/dolphin` 本体設定の読み書きはまだ未着手。

### 2.3 患者検索・基本情報
- オンプレ: `PatientDelegater` が `/patient/name|kana|digit|id` などを実装し、`client/src/main/java/open/dolphin/impl/psearch/PatientSearchImpl.java` が Swing UI を構成。
- Web: `web-client/src/features/patients/api/patient-api.ts` が検索モードと詳細取得、登録・更新 (`POST/PUT /patient`) を担い、`PatientsPage.tsx` でフォームと結果リストを描画。
- 差分: 検索・登録フローは同等。On-prem専用の `/patient/all`、`/patient/custom/{param}`、`/patient/count/*` は Web 側に UI がなく、利用要否を確認する必要がある。

### 2.4 受付・来院管理
- オンプレ: `client/src/main/java/open/dolphin/delegater/PVTDelegater.java`・`PVTDelegater1.java` が `/pvt` 系と `/pvt2` 系を扱い、`client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java` が受付一覧 UI を構成。
- Web: `web-client/src/features/reception/api/visit-api.ts`・`visit-detail-api.ts` が登録・ステータス更新・旧 API 互換 (`GET/POST /pvt`, `PUT /pvt/memo`) を実装し、`web-client/src/features/reception/components/VisitManagementDialog.tsx` と `ReceptionPage.tsx` で UI を提供。
- 差分: Web 版はバーコード受付・担当医記憶などを React Hooks 化。Swing で利用していた一部の列カスタマイズは `TODO` だが、旧 API 操作は `VisitManagementDialog` に隔離した。

### 2.5 予約・施設スケジュール
- オンプレ: `ScheduleDelegater` が `/schedule/pvt/*` と `/schedule/document` を操作し、`client/src/main/java/open/dolphin/impl/schedule/PatientScheduleImpl.java` が医師別ビューを構築。
- Web: `web-client/src/features/schedule/api/facility-schedule-api.ts` と `web-client/src/features/reception/api/appointment-api.ts`、`web-client/src/features/schedule/components/ScheduleReservationDialog.tsx` が同 API を利用し、`FacilitySchedulePage.tsx` に統合。
- 差分: Web 版は ORCA 担当医コード条件をクエリパラメータで構築し、カルテ生成 (`POST /schedule/document`) と予約取消 (`DELETE /schedule/pvt`) を同ダイアログで完結。

### 2.6 カルテ・文書タイムライン
- オンプレ: `DocumentDelegater` がカルテ・添付・フリードキュメント API を一括管理し、`KarteEditor`／`DocumentHistory` が Swing UI を構成。
- Web: `web-client/src/features/charts/components/DocumentTimelinePanel.tsx` と `CareMapPanel.tsx` が `/karte/docinfo`・`/karte/documents`・`/karte/attachment` を表示、`progress-note-api.ts`・`document-api.ts` が `POST/PUT /karte/document` を呼び出す。
- 差分: Web 版は CareMap・添付プレビュー・インライン編集を単画面に統合し、保存時に監査ログを送出。On-prem の `getAllDocument` 相当は未搭載だが現行運用では不要と判断。

### 2.7 検査・ラボ
- オンプレ: `LaboDelegater` と `client/src/main/java/open/dolphin/impl/lbtest/LaboTestPanel.java` が `/lab/module`・`/lab/item` を扱い、Swing テーブルと PDF 出力を提供。
- Web: `web-client/src/features/charts/api/labo-api.ts` が同 API を正規化し、`LabResultsPanel.tsx` が履歴一覧・項目検索・チャート描画を実装。
- 差分: Web 版は値の正規化や異常値表示を TypeScript ユーティリティで再構成し、印刷はブラウザ印刷に寄せている。

### 2.8 診断書・シェーマ
- オンプレ: `client/src/main/java/open/dolphin/letter/MedicalCertificateImpl.java` と `client/src/main/java/open/dolphin/impl/schema/SchemaEditorImpl.java` が `/odletter/*`・`/karte/document` を利用。
- Web: `web-client/src/features/charts/components/MedicalCertificatesPanel.tsx` および `SchemaEditorPanel.tsx`、`web-client/src/features/charts/api/letter-api.ts`・`schema-api.ts` が同等の編集・保存・PDF プレビューを提供。
- 差分: Web 版は Supplement パネルへの統合と監査ログ追加以外は機能同等。

### 2.9 スタンプ管理
- オンプレ: `StampDelegater` がスタンプツリー同期（`PUT /stamp/tree`,`/stamp/tree/sync`,`/stamp/list` など）を担い、`client/src/main/java/open/dolphin/client/StampHolder.java` ほかが UI を実装。
- Web: `web-client/src/features/charts/api/stamp-api.ts` と `StampLibraryPanel.tsx` が `GET /stamp/tree/{userPk}`・`GET /stamp/id/{stampId}` を表示し、カテゴリ別グルーピングを提供。
- 差分: Fetch 系は完了。ツリー編集や発行・購読管理に対応する PUT/DELETE API の UI は未着手で、フェーズ6 スコープ。

### 2.10 PHR・Masuda 拡張
- オンプレ: `MasudaDelegater` が routineMed・rpHistory・userProperty を `/karte/*` 配下で提供し、`PHRDelegater` が `/20/adm/phr/*` を扱う。`CareMapDocument` や `ImageHistoryPanel` が UI を構築。
- Web: `CareMapPanel.tsx` と `attachment-api.ts` が CareMap 表示・添付取得を React へ移植済み。
- 差分: 「治療履歴カレンダー」系は parity。`MasudaDelegater` の拡張 API と PHR 出力は未実装で、要件確認と UI 設計が必要。

## 3. 未解消ギャップ / フォローアップ
- [x] スタンプツリー編集 (`PUT /stamp/tree`,`/stamp/tree/sync`,`/stamp/id`,`DELETE /stamp/list`) を扱う Web UI を実装する。2026-05-27: フェーズ6 バックログとして実装方針を確定（`StampManagement` セクションへ拡張）。
    - 2026-05-30: `web-client/src/features/administration/pages/StampManagementPage.tsx` を追加し、スタンプツリーの閲覧・編集・同期と `/stamp/id` による複製、`DELETE /stamp/list` による削除を Web で完結できるようにした。スタンプライブラリからの複製連携を含む。
- [x] `MasudaDelegater` が提供する routineMed・rpHistory・userProperty 系 API を Web クライアントのカルテ補助パネルへ移植する。2026-05-27: 実装実施を決定（CareMap 補助パネル拡張として着手予定）。
    - 2026-05-30: `MasudaSupportPanel` を CareMap 補助パネルに追加し、`/karte/routineMed/list`・`/karte/rpHistory/list`・`/karte/userProperty/{userId}` を取り込んで定期処方・処方履歴・ユーザー設定メモを集約表示。
- [x] `PHRDelegater` (`/20/adm/phr/*`) の提供は管理画面（既存の `SystemPreferencesPage` 拡張または新設管理タブ）で実装する計画とし、要件整理を進める。2026-05-27: 管理画面対応として合意し、SystemPreferencesPage 拡張案をベースに PHR 管理 UI の要件整理に着手。
    - 2026-05-31: コードベース確認の結果、`SystemPreferencesPage` には PHR タブや `/20/adm/phr/*` を呼び出す処理が存在せず、関連する API クライアントも未実装のためステータスを未完了へ変更。
    - 2026-06-01: `SystemPreferencesPage` に PHR 管理タブ（`PhrManagementPanel`）を追加し、`/20/adm/phr/accessKey`・`/20/adm/phr/{facilityId,patientId,...}`・`/20/adm/phr/allergy|disease|medication|labtest` を `web-client/src/features/administration/api/phr-api.ts` から呼び出す UI を実装。キー生成・JSON ダウンロード・テキスト出力を管理者が操作できるようにした。
- [x] `/patient/all` `/patient/custom/{param}` 等の一括取得 API は管理画面（`Administration` グループ）にダウンロード/フィルタ機能として実装予定。2026-05-27: 実装対象として決定し、Administration グループへの配置方針で運用チームとの詳細擦り合わせを継続。
    - 2026-05-31: コードベース確認の結果、`Administration` グループには該当ページが存在せず、`patient-api.ts` でも `/patient/all` 系エンドポイントを呼び出していないため未完了と判断。
    - 2026-06-01: `web-client/src/features/administration/pages/PatientDataExportPage.tsx` を新設し、`/patient/all`・`/patient/custom/{param}`・`/patient/count/{prefix}` を `patient-export-api.ts` から取得して CSV/JSON ダウンロードと件数チェックを提供。ナビゲーションに「患者データ出力」を追加。
- [x] `/dolphin` 基本設定（POST/PUT）UI は管理画面に統合して提供する計画。2026-05-27: `SystemPreferencesPage` 拡張として実装準備に入り、基本設定 POST/PUT UI の仕様を管理タブへ統合する方針を確定。
    - 2026-05-31: コードベース確認の結果、`system-api.ts` には `/dolphin/activity`・`/dolphin/license`・`/dolphin/cloudzero/sendmail` のみ実装されており、基本設定 POST/PUT を扱う関数や UI が存在しないため未完了と判断。
    - 2026-06-01: `SystemPreferencesPage` の基本情報タブに「新規施設管理者登録」セクションを追加し、`registerFacilityAdmin`（`POST /dolphin`）を `system-api.ts` に実装。既存の施設情報更新（`PUT /user/facility`）と合わせて `/dolphin` 系の初期設定を Web で完結可能にした。

## 4. 参考ドキュメント
- `docs/web-client/process/API_UI_GAP_ANALYSIS.md` – 未実装 API の UI 配置方針とフェーズ計画。
- `docs/web-client/guides/CLINICAL_MODULES.md` – 受付/予約・CareMap・診断書/シェーマ・スタンプ/ORCA の統合仕様。
