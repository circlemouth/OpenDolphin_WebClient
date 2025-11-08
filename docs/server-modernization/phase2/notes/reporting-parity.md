# 帳票ロケール検証メモ（Phase7-2, 2025-11-09）

## 1. 実施概要
- `./scripts/start_legacy_modernized.sh start` で Legacy/Modernized 両スタックを起動し、`ops/tools/send_parallel_request.sh --profile compose POST /reporting/karte <ID>` を用いて代表帳票（日本語・英語・レセ電）を並列送信する計画だった。
- 認証ヘッダーは `tmp/reporting.headers`（`userName: doctor1`, `password: dolphin`）を使用、ペイロードは `tmp/reporting_karte_payload*.json` でロケール別に切替。
- 送信結果は `artifacts/parity-manual/reporting_karte_{ja,en}/ {legacy,modern}/meta.json` に保存し、エラー/HTTP ステータスを記録済み。
- ARM64 ホストで `docker` を実行しているため、Legacy サーバーの `server` イメージ（amd64）起動時に「platform mismatch」警告が毎回発生し、10〜15 分おきにコンテナが停止する制約あり。

## 2. HTTP 応答と証跡
| ケース | Legacy 応答 | Modernized 応答 | 備考/証跡 |
| --- | --- | --- | --- |
| 日本語サマリ (`reporting_karte_ja`) | 404（`artifacts/parity-manual/reporting_karte_ja/legacy/meta.json`） | 404（`…/modern/meta.json`） | 認証成功後も REST リソース未登録のため 404。 |
| 英語サマリ (`reporting_karte_en`) | `curl: (7)` 接続不可（Legacy コンテナ停止中） | 404（`artifacts/parity-manual/reporting_karte_en/modern/meta.json`） | Legacy を再起動しても 404 になる想定（リソース不存在）。 |
| レセ電向け帳票 | 未実施（テンプレート不在、REST 404 確認済み） | 未実施 | `server-modernized/reporting/templates/` にレセ電系テンプレートが存在しないため入力仕様を確定できず。 |

`pdftotext` / `diff-pdf` / `pdffonts` は PDF が生成されなかったため未実施。

## 3. ブロッカー整理

### 3.1 REST リソースが WAR に含まれていない
`server-modernized/src/main/webapp/WEB-INF/web.xml:20-49` に登録済みの RESTEasy リソース一覧に `ReportingResource` / `/reporting/*` 系エントリが存在せず、`/openDolphin/resources/reporting/karte` は 404 となる。Legacy 版の WAR も同じ構成で、双方とも帳票 API が未実装である。

### 3.2 テンプレートと仕様がサマリ 1 種のみ
`server-modernized/reporting/templates/` には `patient_summary_{ja_JP,en_US}.vm` のみが存在し、レセ電/レセプト向けテンプレートやラベル定義がない。したがって「代表帳票（日本語/英語/レセ電）」という Phase7-2 要件を満たすペイロードを構築できない。テンプレート追加時は `docs/server-modernization/reporting/LOCALE_REVIEW_CHECKLIST.md` に沿って翻訳レビューを行い、`docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md:84` の網羅対象へ登録する必要がある。

### 3.3 フォント埋め込み設定が未対応
`PdfDocumentWriter#createBaseFont` は `BaseFont.NOT_EMBEDDED` を指定しており（`server-modernized/src/main/java/open/dolphin/reporting/PdfDocumentWriter.java:118-123`）、たとえ API が整備されても PDFFonts で確認される埋め込みフォントは空のままになる。Legacy 版 iText でも同じ挙動であり、フォントを確実にバンドルするには `BaseFont.EMBEDDED` へ変更し、`ops/modernized-server/docker/Dockerfile` で `HeiseiKakuGo-W5` 等の .ttf/.otf を WildFly へ同梱するか、`jboss-deployment-structure.xml` でモジュール参照を追加する必要がある。

## 4. フォールバック案・次アクション
1. **REST 実装**  
   - `open.dolphin.reporting.PdfRenderer` をラップする `ReportingResource`（例: `@Path("/reporting/karte")`）を `server-modernized` / `server` の双方へ追加し、`ReportContext` を JSON で受け取れるよう DTO を設計する。  
   - `server-modernized/src/main/webapp/WEB-INF/web.xml` と Legacy `web.xml` にリソースを登録し、Checklist #84 の「帳票 API を CLI で叩く」条件を満たす。
2. **テンプレート拡充**  
   - `server-modernized/reporting/templates/` にレセ電向けテンプレート（仮称 `receipt_export_{ja_JP,en_US}.vm`）を追加し、`docs/server-modernization/reporting/LOCALE_REVIEW_CHECKLIST.md` と `docs/server-modernization/reporting/3_5-reporting-modernization.md` に運用手順を追記する。  
   - テンプレート追加後に `scripts/api_parity_targets.reporting.json`（新規）を作成し、CLI から 3 ロケールを一括送信できるようにする。
3. **フォント検証フロー**  
   - `PdfDocumentWriter` をフォント埋め込み対応へ修正後、`pdffonts artifacts/.../legacy/output.pdf`→`embedded=yes` を確認、`diff-pdf --output-diff` で Legacy/Modern 差分を抽出する手順を `docs/server-modernization/phase2/notes/reporting-parity.md`（本ファイル）に追記。  
   - `pdftotext` により日本語/英語のテキスト抽出結果を比較し、ロケール設定が `ReportContext#locale` と一致することを確認する。
4. **暫定プレビュー**  
   - REST 実装が完了するまでは `mvn -pl server-modernized -am -DskipTests package && java … open.dolphin.reporting.PdfRendererKt --templates server-modernized/reporting/templates --locale ja-JP --output artifacts/tmp/reporting-preview.pdf` の手順で PDF を採取し、`artifacts/parity-manual/reporting/manual-preview/` へ保存する。CLI で生成した PDF に `pdffonts` を適用してフォント状態を確認し、結果を `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md:84` の備考欄へリンクする。

## 5. 未収束事項
- Legacy コンテナは ARM ホストでの amd64 エミュレーションにより長時間稼働しない。安定取得が必要な場合は `docker buildx build --platform linux/arm64/v8` で ARM 版イメージを生成するか、CI 側 x86 ノードで帳票 API を先に実装してから差分比較する。
- `/reporting/karte` が 404 のままでは Checklist #84 を完了にできないため、REST 実装とテンプレート拡充が完了するまで同チェックを未完了ステータスで維持する。
