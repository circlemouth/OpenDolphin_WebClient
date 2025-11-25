# カルテ/診療記録機能レビュー（RUN_ID=20251116T152300Z）

## 背景
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`。
- Web クライアント仕様は `docs/web-client/guides/CLINICAL_MODULES.md` と `docs/web-client/features/*`（特にカルテ保存・SafetySummary）が要求する API 群を基準とした。
- モダナイズ版サーバーの対象ソース: `server-modernized/src/main/java/open/dolphin/rest/KarteResource.java`、`.../session/KarteServiceBean.java`、`common/src/main/java/open/dolphin/infomodel/*`。

## 調査結果
### 1. 既存カルテの更新 API が未実装
- フロントエンドは既存カルテ編集時に `PUT /karte/document` へ `DocumentModel` 全体を送信する設計（`web-client/src/features/charts/api/document-api.ts:7-19`、`ChartsPage.tsx` での `updateDocument` 呼び出し参照）。
- モダナイズ版 `KarteResource` にはタイトルのみを更新する `PUT /karte/document/{id}`（`server-modernized/src/main/java/open/dolphin/rest/KarteResource.java:292-320`）しか存在せず、本文やモジュールの更新を受け付けるエンドポイントが存在しない。
- Legacy も同じ制約だったが、Web クライアントではカルテ再編集が UI に組み込まれており、終端が 404/405 になる。`POST /karte/document` を流用すると新規版を作ってしまうため、差分更新 API を早急に実装する必要がある。

### 2. SafetySummary／Masuda サポート用エンドポイント欠如
- UX ガイドでは SafetySummaryCard / MasudaSupportPanel が `GET /karte/routineMed/list`、`/karte/rpHistory/list`、`/karte/userProperty/{userId}` を利用する前提（`docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md:90`、`web-client/src/features/charts/api/masuda-api.ts:61-101`）。
- モダナイズ版 REST API インベントリ（`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md:72-110`）には上記パスが一切列挙されておらず、`server-modernized/src/main/java/open/dolphin/rest` 配下にも該当 `@Path` 実装が存在しない。
- 現状 Web クライアントの SafetySummary は例外を握り潰して空データ表示になるだけで、Legacy Swing で提供していた現用薬・処方履歴の参照が行えない。Masuda 系 API の Jakarta/JPA 実装と DTO を追加する必要がある。

### 3. `/karte/image/{id}` のパスパラメータ名が不一致
- 要件ではシェーマや画像を単体表示する際に `GET /karte/image/{id}` を使用する（`docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md:282-286`）。
- `KarteResource#getImage` は `@Path("/image/{id}")` に対して `@PathParam("param")` をバインドしており、実行時に `idStr` が `null` → `Long.parseLong(null)` で 500 になる（`server-modernized/src/main/java/open/dolphin/rest/KarteResource.java:327-334`）。
- Legacy からの既知バグだが、Web クライアントは MSW モック上で正常化しているため、本番 API も `@PathParam("id")` へ修正しないと画像ビューア／添付ダウンロードが使用できない。

### 4. 添付ファイルの外部ストレージ永続化が二重に実行される
- S3 モードで添付ファイルをアップロードする `AttachmentStorageManager` は、`persistExternalAssets` 呼び出し 1 回につき PUT Object を行う。
- `KarteServiceBean#addDocument` では `em.merge` 後に同メソッドを 2 回連続で呼び出しており（`server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java:493-504`）、大きな添付ほど無駄に 2 回アップロードされる。障害時には部分成功のまま `uri` が更新されるリスクもある。
- 期待動作は「1 ドキュメント保存につき 1 回のアップロード」なので、呼び出しの重複を解消し、失敗時にトランザクションへ例外を伝播させるべき。

## 推奨アクション
1. `PUT /karte/document` 相当のリソースを追加し、`DocumentModel` 全体更新を行うサービス層 API（`KarteServiceBean#updateDocument` 等）を新設する。既存のタイトル更新 API は維持しつつ、UI の `updateDocument` を本エンドポイントへ接続する。
2. Legacy の `MasudaDelegater` 相当機能を調査し、`routineMed` / `rpHistory` / `userProperty` を RESTEasy へ移植。API インベントリと `CLINICAL_MODULES.md` の SafetySummary 節に整合するデータモデルを定義する。
3. `KarteResource#getImage` の `@PathParam` を `"id"` へ修正し、NPE を防ぐ回帰テストを追加する。
4. `KarteServiceBean#addDocument` 内の `attachmentStorageManager.persistExternalAssets` 呼び出しを 1 回に統合し、アップロード失敗時は `RuntimeException` を送出して `@Transactional` ロールバックに任せる。

## 実装ログ（RUN_ID=20251116T210500Z-A / Worker-A）
- `PUT /karte/document` を追加し、`server-modernized/src/main/java/open/dolphin/rest/KarteResource.java` で POST/PUT 共通の関連構築ヘルパーを導入。`KarteServiceBean#updateDocument` では差分削除（モジュール/シェーマ/添付）と添付 S3 アップロードを 1 回に統合し、既存エントリ不在時は `IllegalArgumentException` を返すようにした。
- SafetySummary/Masuda 向けに `RoutineMedicationResponse` / `RpHistoryEntryResponse` / `UserPropertyResponse` DTO を新設し、`GET /karte/routineMed.list`・`/karte/rpHistory.list`・`/karte/userProperty/{userId}` をモダナイズ側へ実装。`BundleMed` の `ClaimItem` から RP 構造を復元し、React Query が参照する `moduleInfoBean`・`moduleList` も `ModuleModelConverter` でシリアライズ。
- `/karte/image/{id}` の `@PathParam` 名不一致を修正し、Masuda API を `docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md` の要件どおり Web クライアントから利用できるようルーティングを整備。
- 検証: `mvn -pl server-modernized -DskipTests test`（REST モジュールのコンパイル・静的解析のみ）に通過。`npm run lint -- --max-warnings=0`（web-client）実行済みログなし → 今回は Java 修正のみのため対象外。詳細は `docs/server-modernization/phase2/operations/logs/20251116T210500Z-A-karte-worker.md` を参照。
