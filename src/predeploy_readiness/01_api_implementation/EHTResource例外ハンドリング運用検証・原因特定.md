# EHTResource例外ハンドリング運用検証・原因特定（predeploy readiness）

- RUN_ID: `20251220T163500Z`
- 期間: 2025-12-26 09:00 - 2025-12-27 09:00 (JST)
- 優先度: medium / 緊急度: medium
- YAML ID: `src/predeploy_readiness/01_api_implementation/EHTResource例外ハンドリング運用検証・原因特定.md`

## 目的
- EHTResource の例外ハンドリングを整理し、WebApplicationException/IOException 以外が汎化されている箇所を明確化する。
- 運用側で原因特定に必要なログ/監査情報（errorMessage/traceId/requestId）の不足点を洗い出す。
- 追加ログ/監査イベント/エラーハンドリングの是正案を定義し、実装タスクへ接続する。

## 調査対象
- `server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/EHTResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchAuditHelper.java`
- `server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContextExtractor.java`
- `server-modernized/src/main/java/open/dolphin/rest/AbstractResource.java`

## 現状整理（汎用化されている例外パターン）
### 1) adm20 EHTResource
- `deleteDocument` で `catch (Exception ex)` → `WebApplicationException` へラップ（`WebApplicationException/IOException` 以外は汎化）。
- `checkInteraction` の DB 例外は `processError(e)` 後に `WebApplicationException(e)`（stderr へスタック出力のみ）。
- `handleClaimSend` は `StringIndexOutOfBoundsException` のみフォールバック扱いでログ＋監査、他の例外はそのまま上位へ伝播（監査・ログなし）。
- `processError` は `System.err` 出力のみで、traceId/requestId を関連付ける情報がない。

### 2) touch EHTResource
- `deleteDocument` の失敗は `RuntimeException` を監査記録したうえで再送出（ただし `IOException` 等は未捕捉）。
- `checkInteraction` を含む複数箇所で `catch (Exception e)` → `processError(e)` → `WebApplicationException(e)`。
- 施設 ID 取得の `catch (Exception e)` は `SEVERE` ログのみで requestId/traceId の埋め込みなし。
- `processError`/`closeConnection` が `System.err` に依存し、監視ログに traceId/requestId が残らない。

## 運用側で不足する情報（原因特定の阻害要因）
- **errorMessage**: `deleteDocument` 以外の失敗では監査・ログに統一的に残らず、JAX-RS が汎用 500 を返すだけになる。
- **traceId/requestId**: `processError` と `System.err` ログは相関 ID を出力せず、運用監視から特定できない。
- **例外種別の粒度**: `WebApplicationException` への汎用ラップで例外クラスがログ/監査に残らないケースがある。
- **監査イベントの失敗記録**: 成功のみ監査を記録する操作（メモ/アレルギー/診断/バイタル/フィジカル/Claim 送信）では、失敗時に audit が残らない。

## 是正案（設計方針）
1. **例外の統一ロギング**
   - `EHTResource` 内で StreamingOutput の実行ブロックをラップし、例外時に `Logger` へ `traceId/requestId` と操作 ID を出力。
   - `System.err` への `printStackTrace` を廃止し、構造化ログへ統一。
2. **監査イベントの失敗記録の拡張**
   - 既に成功監査が存在する操作は失敗時も `status=failed` + `exceptionClass` + `errorMessage` を記録。
   - `TouchAuditHelper` / `AuditTrailService` 側に requestId/traceId を必ず含める（詳細へも反映）。
3. **エラーレスポンスの標準化**
   - `AbstractResource.restError` を活用し、`traceId` を含む JSON エラーを返却。
   - `errorCode` の定義（例: `eht_document_delete_failed`）を追加し、運用が原因切り分けできるコード体系へ。
4. **Claim 送信フォールバックの拡張**
   - `StringIndexOutOfBoundsException` 以外の例外も捕捉し、監査イベントに失敗詳細を記録。
   - フォールバック時にも `requestId/traceId` をログ・監査の両方へ付与。

## 実装タスク案（次フェーズへの接続）
| ID | 対象 | 対応内容 | 備考 |
| --- | --- | --- | --- |
| EHT-ERR-01 | `adm20/rest/EHTResource` | `processError` を Logger + traceId/requestId 出力へ置換 | `SessionTraceManager` と `X-Request-Id` を併用 |
| EHT-ERR-02 | `adm20/rest/EHTResource` | `handleClaimSend` に汎用例外の監査記録・ログ出力を追加 | `fallback` と区別して `status=failed` を追加 |
| EHT-ERR-03 | `touch/EHTResource` | 主要 API で失敗監査（status=failed, errorMessage, exceptionClass）を追加 | TouchRequestContext を共通利用 |
| EHT-ERR-04 | `touch/EHTResource` | `processError`/`closeConnection` の `System.err` 出力を Logger 化 | requestId/traceId をログに含める |
| EHT-ERR-05 | `EHTResource` 共通 | `AbstractResource.restError` を用いた JSON エラー返却の導入 | traceId/requestId を応答に含める |

## 追加調査/確認事項
- 監査イベントの必須フィールド（errorMessage/traceId/requestId）と監査基盤の受け入れ可否。
- `LogFilter` の traceId 生成規則が `TouchRequestContext` の traceId と競合しないことの確認。

## 留意点
- Legacy/Phase2 ドキュメントは参照のみとし、更新対象外。
- ORCA 実環境接続や Stage/Preview 検証は本タスクでは未実施。
