# ORCA-05/06/08 エラー/フォールバック方針とテスト網羅表 (RUN_ID=20251124T123000Z)

- 親 RUN_ID: 20251124T000000Z
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml
- 対象: ORCA マスター REST (ORCA-05/06/08) と web-client ブリッジ層のエラー/フォールバック設計、および API/UI テスト網羅表

## 1. エラー/フォールバック方針
想定エラーごとの REST 応答・UI 挙動・監査メタを下表で統一する。レスポンスは OpenAPI 正式版の `ErrorResponse`／各 `*Entry` を前提とし、監査メタは `{runId,dataSource,cacheHit,missingMaster,fallbackUsed,snapshotVersion,fetchedAt,traceId}` を共通必須とする。

| シナリオ | REST 応答 | UI 挙動 | 監査メタ (最低) | フォールバック/再試行 |
| --- | --- | --- | --- | --- |
| 404 Not Found (server) | 404 + `ErrorResponse{code="ORCA_MASTER_NOT_FOUND",message,runId,dataSource="server",missingMaster=true,fallbackUsed=true}` | 警告バナー + 「暫定マスターに切替え」トースト。ORCA-05 は保存ブロック、ORCA-06/08 は警告のみで閲覧許可。 | missingMaster=true / fallbackUsed=true / dataSource=server / cacheHit=false | snapshot → mock → fallback 定数の順で取得し 200 を返却。全経路失敗なら 404 を透過。 |
| 400 Bad Request (パラメータ不足/型不正) | 400 + `ErrorResponse{code="INVALID_REQUEST",details}` | Inline エラー＋再入力促し。保存不可。 | missingMaster=false / fallbackUsed=false / dataSource=server | フォールバックなし。パラメータ修正後に再試行。 |
| 429 Too Many Requests | 429 + Retry-After 秒 + `ErrorResponse{code="RATE_LIMIT"}` | トースト「混雑中、xx 秒後に再試行」。表示データはキャッシュ/スナップショットに差し替え。 | dataSource=snapshot|mock, cacheHit=(キャッシュ有無), fallbackUsed=true | Retry-After 経過後に自動リトライ。キャッシュ・snapshot を優先表示。 |
| 500 / DB 接続失敗 | 503 + `ErrorResponse{code="BACKEND_UNAVAILABLE"}`（server dataSource） | 警告バナー + トースト。ORCA-05/08 は保存ブロック、ORCA-06 は手入力を許容し `fallbackUsed=true`。 | missingMaster=true / fallbackUsed=true / dataSource=snapshot|mock|fallback | snapshot→mock→fallback の順で再取得。失敗時は 503 を透過。 |
| キャッシュミス | 200 応答 + `cacheHit=false` | UI 変更なし。ローディング→正常表示。 | cacheHit=false / dataSource=server|snapshot|mock | なし。次回は cacheHit=true を期待。 |
| 部分欠損（必須フィールド欠落・空配列） | 200 応答 + `partial=true, missingFields[]` を DTO 拡張フィールドで返却（ORCA-05: minPrice/youhou/material/kensaSort 欠落、ORCA-06: payerRatio/prefCode/cityCode、ORCA-08: tensuVersion/tanka） | 警告バナー。ORCA-05: 保存ブロック。ORCA-06: 手入力許可。ORCA-08: 計算結果は警告付きで表示。 | missingMaster=true / fallbackUsed=true (fallback 利用時) / partial=true / missingFields=<列名> | snapshot→mock→fallback で補完。全経路欠落なら 200 のまま partial=true を維持し UI に警告。 |

### 1.1 フォールバック可否・置換ルール

| マスター種別 | 空配列許容 | フォールバック連鎖 | 既存データ置換可否 | 備考 |
| --- | --- | --- | --- | --- |
| ORCA-05 薬剤/用法/特定器材/検査分類 | 不可（保存ブロック） | server → snapshot → mock → fallback 定数（最小カテゴリのみ） | 点数マスタ等への置換不可。既存 UI 値の温存は不可。 | minPrice/youhou/material/kensaSort が欠落したら保存不可＋警告。 |
| ORCA-06 保険者・住所 | 空配列を許容し、fallback で最小コードセット/手入力を提示 | server → snapshot → mock → fallback 定数（国保/社保/後期 + 住所フリーテキスト） | 住所は手入力値を維持可。既存コードへの自動置換は不可。 | zip→住所解決失敗時は pref/city を null で返し warning。 |
| ORCA-08 電子点数表 | 条件による空ヒットは許容（警告表示のみ） | server → snapshot → mock（MSW） | 旧点数表・別バージョンへの置換不可。 | tensuVersion は必須。空ヒットでも version/tensuVersion を返却。 |

## 2. テストケース網羅表（API レイヤ）
`MSW`=モック差し替え、`Unit`=fetch adapter / resolver の単体、`E2E`=browser + MSW or proxy。優先度は P1=即実施、P2=次リリースまで、P3=回帰時。

| ID | シナリオ | 再現手段 (MSW/Unit/E2E) | 期待レスポンス/監査メタ | カバレッジ | 優先度 |
| --- | --- | --- | --- | --- | --- |
| API-01 404→snapshot フォールバック (ORCA-05) | MSW: `/orca/master/*` を 404 化、snapshot を有効 | 200 で返却、dataSource=snapshot, missingMaster=true, fallbackUsed=true, cacheHit=false | スモーク未実施 | P1 |
| API-02 400 Bad Request | Unit: 不正クエリを渡す | 400 ErrorResponse、missingMaster=false, fallbackUsed=false | 未実施 | P2 |
| API-03 429 + Retry-After | MSW: 429 + header、Unit: retry ロジック | 429 受信後 snapshot へ切替、audit dataSource=snapshot, fallbackUsed=true | 未実施 | P1 |
| API-04 503(DB 接続失敗) | MSW: 503、Unit: fallback チェック | snapshot/mock/fallback へ降格、missingMaster=true, fallbackUsed=true | 未実施 | P1 |
| API-05 部分欠損 (minPrice, payerRatio, tensuVersion) | MSW: 必須列を削除した JSON を返却 | 200 + partial=true + missingFields, missingMaster=true, fallbackUsed=true | 部分的に実施（ORCA-05のみ） | P1 |
| API-06 キャッシュミス→ヒット遷移 | Unit: React Query TTL を 0→再取得 | 1回目 cacheHit=false, 2回目 cacheHit=true, dataSource 同一 | 未実施 | P2 |
| API-07 空配列 (ORCA-08 範囲外) | MSW: 空配列返却 | 200, cacheHit=true, missingMaster=false, fallbackUsed=false, UI で警告 | 未実施 | P2 |

## 3. テストケース網羅表（UI レイヤ）
UI は Charts/受付/算定で確認。期待表示は `ux/legacy/CHART_UI_GUIDE_INDEX.md` の tone=warning に準拠。

| ID | 画面/機能 | トリガー | 期待 UI 表示 | 期待監査メタ | カバレッジ | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| UI-01 ORCA-05 404 フォールバック | Charts オーダ検索で 404 → snapshot | 警告バナー + 「暫定マスター使用」バッジ、保存ブロック | dataSource=snapshot, missingMaster=true, fallbackUsed=true | 未実施（スモーク未カバー） | P1 |
| UI-02 ORCA-06 住所空レス | 住所検索で空配列 | 警告バナー、住所手入力フィールド有効 | missingMaster=true, fallbackUsed=true, partial=true | 未実施 | P1 |
| UI-03 ORCA-06 rate-limit | 保険者検索で 429 | トースト「混雑中」、snapshot データが表示 | dataSource=snapshot, fallbackUsed=true, cacheHit=(snapshot キャッシュ状態) | 未実施 | P1 |
| UI-04 ORCA-08 部分欠損 (tensuVersion 欠落) | 点数表取得で tensuVersion 欠落レス | 警告バナー + 再計算禁止 | missingMaster=true, partial=true, fallbackUsed=true | 未実施 | P1 |
| UI-05 キャッシュミス/ヒット表示 | 同一検索を連続実行 | 表示変化なし、監査で cacheHit false→true 遷移 | cacheHit フラグが両回送出 | 未実施 | P2 |
| UI-06 スナップショット→server 切替 | WEB_ORCA_MASTER_SOURCE を snapshot→server | dataSourceTransition バナー無し、監査のみ | dataSourceTransition from=snapshot to=server | 未実施 | P2 |
| UI-07 fallback 定数 (ORCA-06) | server+snapshot が 503 | 最小コードセット表示、入力許可 | dataSource=fallback, fallbackUsed=true, missingMaster=true | 未実施 | P1 |
| UI-08 空配列許容 (ORCA-08 範囲外) | 範囲外日付検索 | 0件表示 + 警告なし／監査 missingMaster=false | cacheHit=true, missingMaster=false | 未実施 | P3 |

## 4. 実装メモ
- `ErrorResponse` の `code` は `ORCA_MASTER_NOT_FOUND` / `INVALID_REQUEST` / `RATE_LIMIT` / `BACKEND_UNAVAILABLE` を使用し、`traceId` を必ず付与する。
- `partial`/`missingFields`/`missingTables` は DTO 拡張で optional。UI 側で警告バナーと保存ブロック判定に使用する。
- `fallbackUsed=true` をセットする経路: (1) server 404/429/503, (2) snapshot スキーマ検証失敗, (3) キャッシュ期限切れ＋ server 不達。
- キャッシュ TTL: ORCA-05/08 = 5 分、ORCA-06 住所=7 日/保険者=5 分（既存計画踏襲）。TTL 経過で `cacheHit=false` を強制し監査へ送出する。
- 監査 log sink は `audit.logOrcaQuery`（API 層）と `audit.logUiState`（UI 層）。E2E では両方を収集し、RUN_ID を付与して `artifacts/api-stability/<RUN_ID>/` に保存する。
