# 2025-11-23 ORCA master MSW ギャップメモ

- RUN_ID: `20251123T135709Z`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 本ログ
- 対象スキーマ: `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json`（address / etensu / generic-class / generic-price / hokenja / kensa-sort / material / youhou）
- スコープ: MSW/fixture 組み込みの設計のみ（実装なし、server/ 配下は未変更）

## 1. スキーマ観察サマリ（期待レスポンスの要点）
- `/orca/master/address?zip=`: 住所 1 件返却を想定。欠損時は 404 ではなく空 body を返す運用。`zipCode/prefectureCode/city/town/kana/roman/fullAddress` を提供。
- `/orca/master/etensu?category=&keyword=&effective=`: 電子点数表（カテゴリ 1–5）を `list` 配列 + `totalCount` + `fetchedAt` で返却。`points` は整数、名称区別用 `note` あり。空フィルタで全カテゴリを返す想定。
- `/orca/master/generic-class?keyword=&facility=&effective=`: 薬剤分類ツリー。`classCode/className/kanaName/categoryCode/parentClassCode/isLeaf/startDate/endDate`。facility/effective は将来拡張の透過パラメータ。
- `/orca/master/generic-price?srycd=&effective=`: 薬価。`price` 数値と `unit`、`priceType`、`reference{yukostymd,yukoedymd,source}`。欠損時は 404 ではなく `price: null` を許容する想定。
- `/orca/master/hokenja?pref=&keyword=&effective=`: 保険者検索。`insurerNumber/Name/Kana/prefectureCode/address/phone/insurerType/validFrom/validTo`。keyword は名称/カナ両対応。
- `/orca/master/kensa-sort?keyword=&effective=`: 検査分類。`kensaCode/kensaName/sampleType/departmentCode/classification/insuranceCategory` を list 返却。
- `/orca/master/material?keyword=&effective=`: 特定器材。`materialCode/Name/category/insuranceType/unit/price/startDate/endDate/maker`。price 0 許容。
- `/orca/master/youhou?keyword=&effective=`: 用法マスタ。`youhouCode/Name/timingCode/routeCode/daysLimit/dosePerDay/comment`。days/dose は省略可。

## 2. MSW ハンドラ配置方針
- **ハンドラ追加先**: `web-client/src/mocks/handlers/orcaMasterHandlers.ts` を新設し、`handlers/index.ts` に合流。既存 `chartHandlers` と同じ http インスタンスを使用し、`/orca/master/*` パスをそのまま扱う（REST サーバーの prefix `/api` を付けない前提で統一）。
- **フィクスチャ置き場**: `web-client/src/mocks/fixtures/orcaMaster.ts` を追加。各 JSON の `expectation.body` を TypeScript オブジェクト化し、検索結果は list/totalCount/fetchedAt を含む構造で保持。`retryAfterPayload` 等の既存スタイルに合わせてエクスポートを個別定義。
- **レスポンスルール**:
  - address は `zip` クエリ必須。マッチしない場合は `HttpResponse.json({}, {status: 200})` を返す（compatNotes に従い 404 非採用）。
  - etensu/generic-class/hokenja/kensa-sort/material/youhou は `keyword` 前方一致（カナ含む）でフィルタ。空 keyword 時は全件返却し、`totalCount` を list 長さから算出。
  - generic-price は `srycd` 単一取得。未一致時は `{ ...nullPriceFixture, price: null }` を返す案（compatNotes の 404 回避）。
  - `effective` / `facility` など未使用パラメータは透過処理で破棄しない。`fetchedAt` は RUN_ID 時刻を固定値として fixture 側に保持。
  - ヘッダーは `Content-Type: application/json` を統一し、必要に応じ `X-Compat-Mode` に `orca-master-msw` を付与してトレースできるようにする案。
- **エラー/遅延**: 現行 MSW は低遅延。必要であればクエリ `simulateConflict` / `simulateEmpty` をハンドラ内で読み取り、409/204 を返す拡張を後付けする余地を残す。

## 3. 型突合と実装時の TODO
- 既存型 `@/types/orca` とのマッピング案:
  - address → `AddressMasterEntry`（`zipCode`→`zipcode`, `prefectureCode`→`prefecture` へ変換。kana/roman を `kana` フィールドに格納する拡張が必要）
  - hokenja → `InsurerMaster`（`insurerName`→`name`, `prefectureCode`→`addressCode`、`insurerType` は新規フィールドとして `type?` 追加を検討）
  - generic-class → `DrugClassificationMaster`（親コード/leaf を保持するため `parentCode?: string`, `isLeaf?: boolean` を型拡張予定）
  - generic-price → `MinimumDrugPriceEntry`（`priceType` を `priceKind?`, `reference` は `meta?` にネストする拡張が必要）
  - material → `SpecialEquipmentMaster`（`insuranceType`/`maker` を optional 追加）
  - kensa-sort → `LabClassificationMaster`（`sampleType`/`classification`/`insuranceCategory` を optional 追加）
  - youhou → `DosageInstructionMaster`（`timingCode`/`routeCode`/`daysLimit`/`dosePerDay` を拡張。`description` へ `youhouName` をマップ）
  - etensu → 新規 `EtensuMasterEntry` 型を `features/charts/types/orca` に追加する想定（`etensuCategory/medicalFeeCode/name/points/startDate/endDate/note`）
- `features/charts/api/orca-api.ts` の TODO 群（fetchXXX 系）を MSW 対応時に HTTP 呼び出しへ置換する。以下コメント挿入案:
  ```ts
  // TODO(20251123T135709Z): /orca/master/* MSW fixture に対応したら実 API 呼び出しへ差し替える
  ```

## 4. 実装手順のラフ計画（差分イメージ）
1) `mocks/fixtures/orcaMaster.ts` を作成し、8 API 分の固定データをエクスポート。artifact JSON から直接転記し、`fetchedAt` は RUN_ID 由来の `2025-11-23T13:57:09Z` を使用。  
2) `mocks/handlers/orcaMasterHandlers.ts` を作成。`http.get('/orca/master/address', ...)` など 8 本を定義し、共通ヘルパーで keyword フィルタと totalCount 計算を行う。  
3) `mocks/handlers/index.ts` に `...orcaMasterHandlers` を追加。必要なら `worker.start({ onUnhandledRequest: 'bypass' })` へ影響がないことを確認。  
4) 型拡張が必要な箇所（`@/types/orca`, `features/charts/types/orca`）を別 PR で追加し、`orca-api.ts` TODO を HTTP 実装に置換。  
5) API surface ドキュメント（`docs/web-client/architecture/REST_API_INVENTORY.md` / `process/API_UI_GAP_ANALYSIS.md`）の ORCA 行に「MSW 対応済/準備中」フラグを同期。

## 5. フォローアップ
- MSW 実装は未着手。上記 4) の型拡張は UI 実装（OrcaOrderPanel のマスター検索）と同一スプリントで実行する。
- API_UI_GAP_ANALYSIS の ORCA 行に「MSW準備中 (RUN_ID=20251123T135709Z)」を追記予定。
- artifacts 由来のテストデータは RUN_ID ごとに差し替え可能なよう、fixtures のデフォルト export を「最新版」扱いにし、旧 RUN_ID を残す場合は named export でバージョンを区別する運用を採用したい。

## 6. ドキュメント反映（RUN_ID=20251123T135709Z）
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` へ ORCA-08 マスタ系 8 エンドポイント（address/etensu/generic-class/generic-price/hokenja/kensa-sort/material/youhou）の Spec-based 行を追記し、MSW フィクスチャ前提で `Spec-based (MSW)` 表記と DTO 要約を記載。証跡: 本ログおよび `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json`。

## 7. 2025-11-23 追加メモ（MSW 実装確認・lint）
- `web-client/src/mocks/fixtures/orcaMaster.ts` / `web-client/src/mocks/handlers/orcaMasterHandlers.ts` / `web-client/src/mocks/handlers/index.ts` が作成済み。開発サーバー起動時に `/orca/master/*` 8 本を MSW で返却することを確認。
- 型整合: `web-client/src/types/orca.ts` に `OrcaMasterListResponse<T>` と Etensu/Youhou/Material/Insurer などのフィールド追加を反映済み（`Spec-based (MSW)` と同期）。
- lint: `cd web-client && npm run lint -- --max-warnings=0 --no-cache` を実行し、エラー 0 で完了。以前のキャッシュ由来警告（ReplayGapContext.tsx）は解消済み。
- ドキュメント更新: `docs/web-client/process/API_UI_GAP_ANALYSIS.md` を「MSW実装済み」へ差し替え、Web クライアント差分は ORCA-04 UI backlog のみ残存と整理。`src/webclient_modernized_bridge/02_ORCAマスターデータギャップ報告精査.md` に MSW 実装・型整合の進捗と次ステップ（UI 連携、実 API 切替）を反映。

## 7. Worker指示B: Webクライアント型整合パッチ（types のみ変更）
- RUN_ID=`20251123T135709Z`。`web-client/src/types/orca.ts` を `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json` のフィールドに揃えて更新。
  - list ラッパー (`list`/`totalCount`/`fetchedAt`) を表現する `OrcaMasterListResponse<T>` を追加し、address 以外のマスタレスポンスに対応。
  - フィールド名ずれを解消（例: `classCode/className`, `materialCode/materialName`, `insurerName/insurerKana`, `zipCode/prefectureCode`）。`price` の null 許容・`reference` の入れ子など null/optional もスキーマ準拠に修正。
  - 新規 `EtensuMasterEntry` を追加し、`youhou`/`kensa-sort`/`material` などの追加属性（daysLimit/dosePerDay/sampleType/insuranceType/maker など）を optional で保持。
- 型チェック: `cd web-client && npm run typecheck -- --pretty false` を実行し `tsc --noEmit` が成功（エラーなし）。

## 8. 2025-11-23 追記 (ワーカーA: ORCAマスタ fetch 実装)
- RUN_ID=`20251123T135709Z`。`web-client/src/features/charts/api/orca-api.ts` の TODO スタブを実装し、8 マスタ（address/generic-class/generic-price/youhou/material/kensa-sort/hokenja/etensu）を list ラッパー付きで取得。
- MSW フィクスチャをラッパー形式に揃え、handlers で同型レスポンスを返すよう調整（`web-client/src/mocks/fixtures/orcaMaster.ts`、`web-client/src/mocks/handlers/orcaMasterHandlers.ts`）。
- 型補完: `web-client/src/types/orca.ts` に minimumDrugPrice/address 用のレスポンス型 alias を追加。
- チェック: `cd web-client && npm run typecheck -- --pretty false` 成功（エラーなし）。

## 9. 2025-11-23 追記 (ワーカー指示3: 点数帯フィルタ UI 設計メモ)
- RUN_ID=`20251123T135709Z`。`docs/web-client/process/API_UI_GAP_ANALYSIS.md` の ORCA-04 節へ OrcaOrderPanel 点数帯フィルタ UI の実装方針メモを追加（検索パラメータ `min-max[,yyyymmdd]`、必要フィールド、キャッシュキー/型結線、禁忌チェック連携まで整理）。
- 実装対象は UI/クライアント側のみ（本タスクでは MSW/コードは未変更）。サーバー API は `/orca/tensu/ten/{param}/` を利用し、`min-max` 不整合はクライアント側で入力抑止する設計とした。

## 10. 2025-11-23 追記 (ワーカー指示2: MSW 反映ステータス更新)
- RUN_ID=`20251123T135709Z`。ORCA-08 マスタ系のステータスを「Spec-based / MSW 実装済み、UI 実装中」として `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` に更新。MSW 返却済みであること、UI 連携（ORCA-04 点数帯フィルタ）が進行中であることを明記。
- `docs/web-client/process/API_UI_GAP_ANALYSIS.md` の Web クライアント差分を「対応状況: MSW/設計済み、UI実装中」とし、MSW 返却を利用して UI 実装を継続する旨を追記。
- `src/webclient_modernized_bridge/02_ORCAマスターデータギャップ報告精査.md` のギャップ表に「対応状況」列を追加し、ORCA-04 を「MSW/設計済み、UI実装中」、ORCA-05/06/07 を「未着手」、ORCA-08 を「MSW 実装済み（web-client）、サーバー未実装」と明示。
