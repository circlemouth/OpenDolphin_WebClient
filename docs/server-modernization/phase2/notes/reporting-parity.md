# 帳票ロケール検証メモ（Phase7-2, 2025-11-09）

## 1. 実施概要
- `./scripts/start_legacy_modernized.sh start` で Legacy/Modernized 両スタックを起動し、`ops/tools/send_parallel_request.sh --profile compose POST /reporting/karte <ID>` を用いて代表帳票（日本語・英語・レセ電）を並列送信する計画だった。
- 認証ヘッダーは `tmp/reporting-headers/doctor.headers`（doctor1/dolphin）を基本とし、SYSAD 手順は `tmp/reporting-headers/sysad.headers` を使用する。ペイロードは `tmp/reporting_karte_payload_{ja,en}.json` でロケール別に切替。
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

## 6. `/reporting/karte` 復旧手順案（2025-11-12 更新）

### 6.1 フォント配置と Docker イメージ差分
- `ops/modernized-server/docker/Dockerfile` に `RUN mkdir -p /opt/jboss/fonts && cp files/fonts/*.ttf /opt/jboss/fonts/` を追加し、`HeiseiKakuGo-W5`（ゴシック）、`HeiseiMincho-W3`（明朝）、`IPAexGothic/IPAexMincho` を同梱する。Legacy でも同手順を行い、両環境でフォントセットを揃える。
- `ops/modernized-server/docker/files/fonts/README.md`（新規予定）に配置基準（商用可否、ライセンス、ファイル名）を記載し、`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` から参照する。
- 既存コンテナを再ビルドできない間は、`docker cp fonts/*.ttf server-modernized-dev:/opt/jboss/fonts/` で暫定配置し、WildFly CLI から `module add --name=com.opendolphin.fonts --resources=/opt/jboss/fonts/IPAexGothic.ttf --dependencies=sun.jdk` を実行したのち `jboss-deployment-structure.xml` へ `com.opendolphin.fonts` を追加して classloader から参照させる。

### 6.2 `PdfDocumentWriter` 設定の見直し
- 現状: `server-modernized/src/main/java/open/dolphin/reporting/PdfDocumentWriter.java` で `BaseFont.createFont(...)` に `BaseFont.NOT_EMBEDDED` が指定されており、日本語帳票でもフォントが埋め込まれない。
- 対応案:
  1. `PdfDocumentWriter#loadFont`（新設）で「メインフォント（IPAex ゴシック）」「フォールバック（明朝）」をロードし、`PdfRenderer` から `PdfDocumentWriter` へ `ReportContext#locale` を渡して切替。
  2. `BaseFont.createFont(fontPath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED, true, ... )` に変更し、`PdfWriter#setViewerPreferences(PdfWriter.PDFX32000)` で埋め込み必須モードを有効化。
  3. `docs/server-modernization/reporting/LOCALE_REVIEW_CHECKLIST.md` に「フォント差し替え時の pdffonts / diff-pdf / pdftotext 取得手順」を追記し、`artifacts/parity-manual/reporting_karte_<locale>/<RUN_ID>/` に `pdffonts.txt` を保存する。

- **2025-11-12 更新:** `reporting/src/main/java/open/dolphin/reporting/PdfDocumentWriter.java` に `/opt/fonts/NotoSansCJKjp-Regular.otf` 等の解決パスを追加し、フォールバックフォントも `BaseFont.EMBEDDED` へ統一した。`mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` → `docker cp server-modernized/target/opendolphin-server-*.war opendolphin-server-modernized-dev:/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war` → `docker exec opendolphin-server-modernized-dev touch /opt/jboss/wildfly/standalone/deployments/opendolphin-server.war.dodeploy` でホットデプロイ済み。フォント本体は `ops/assets/fonts/NotoSansCJKjp-Regular.otf` を `/opt/fonts/` へ `docker cp` で配置し、コンテナ再ビルド禁止期間でも `BaseFont.EMBEDDED` が有効になるようにした（`/opt/fonts` 直下を優先検索する）。

### 6.3 CLI テストフロー（再実行計画）
1. `ops/tests/reporting/karte_cli.sh` を追加し、`PARITY_HEADER_FILE=tmp/reporting-headers/doctor.headers`（または `sysad.headers`）と `PARITY_BODY_FILE=tmp/reporting_karte_payload_{ja,en}.json` を自動設定する。`--run-id` で指定した ID を `TRACE_RUN_ID` にも反映し、出力は `artifacts/parity-manual/reporting_karte_<locale>/<RUN_ID>/{legacy,modern}/` へ集約する。レスポンスが `Content-Type: application/pdf` かつ 200 の場合は `response.pdf` へリネームし、`*.http` テンプレ（`ops/tests/reporting/reporting_karte_{ja,en}.http`）と同一のボディを送信する。
2. 実行結果（HTTP ステータス、`X-Report-*` ヘッダー、PDF バイナリ）を `artifacts/parity-manual/reporting_karte_{ja,en}/<RUN_ID>/` に保存し、`pdffonts` / `pdftotext -layout` / `diff-pdf --output-diff` を同ディレクトリへ出力。
3. CLI から 404 が返った場合は `docker compose exec server-modernized-dev /opt/jboss/wildfly/bin/jboss-cli.sh --connect "deployment-info"` を実行し、WAR が `open.dolphin.rest.ReportingResource` を含むビルドかどうかを即座に確認する（`jar tf /opt/jboss/wildfly/standalone/deployments/opendolphin-server.war | grep ReportingResource`）。
4. Legacy も同じフローを実施し、ARM ホストで stop した場合は `docker-compose.legacy.yml` の `platform: linux/amd64` 指定をコメントアウトし、ローカルビルド済み ARM イメージを参照する。

> **ステータス:** 2025-11-12 時点でフォント配置・`PdfDocumentWriter` 改修・`ops/tests/reporting/karte_cli.sh` の整備と実行ログ格納先の雛形作成を完了。`/reporting/karte` の再実行は docker 再構築解禁待ちのため「実行待ち」とし、RUN_ID は未発行。

### 6.4 既存 `ReportingResource` 実装との差分整理
| 項目 | 現状 (`server(-modernized)/src/main/java/open/dolphin/rest/ReportingResource.java`) | 復旧案で追加する内容 |
| --- | --- | --- |
| パス/登録 | クラスは `@Path("/reporting")` で存在し、`server-modernized/src/main/webapp/WEB-INF/web.xml` に `open.dolphin.rest.ReportingResource` が列挙されている。ただし Phase7 で運用中のコンテナは 2025-10-31 ビルドを使用しており、新しい WAR がデプロイされていないため `/reporting/karte` へアクセスすると 404 になる。 | `docker compose -f docker-compose.modernized.dev.yml exec server-modernized-dev ls /opt/jboss/wildfly/standalone/deployments` で使用中 WAR を確認し、`mvn -f pom.server-modernized.xml package` → `docker compose build server-modernized-dev` を行えるタイミングで差し替える。再ビルド不可期間中は `jboss-cli` の `undeploy/deploy` で WAR をホットスワップする。 |
| フォント・テンプレ | 現状テンプレートは `patient_summary_{ja_JP,en_US}.vm` のみで、`PdfDocumentWriter` も非埋め込み。 | §6.1/6.2 のフォント配置に加え、`reporting/templates/receipt_export_{ja_JP,en_US}.vm` を拡充し、`ReportingPayload` へ `documentType` を追加してテンプレ切替を制御する。 |
| CLI 証跡 | 404 のため `artifacts/parity-manual/reporting_karte_*` は空。 | §6.3 の CLI を実行し、`X-Report-Template` / `X-Report-Locale` ヘッダーと PDF バイナリを保存したうえで `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #84 を Close できる状態にする。 |

### 6.5 Legacy WAR への `opendolphin-reporting` 差し替え
- Legacy 側は JDK8/WildFly10 制約のためフルビルドすると multi-release 対応の新規依存（`module-info.class` を含む `commons-codec 1.17.1` 等）でデプロイに失敗する。そのため `docker create legacy-vs-modern-server` で同一イメージの一時コンテナを作成し、`/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war` をホストへコピーして退避 (`tmp/opendolphin-server-legacy-original.war`)。
- 退避 WAR を `tmp/legacy-war-work/` に展開後、`reporting/target/opendolphin-reporting-2.7.1.jar`（BaseFont.EMBEDDED 化済み）で `WEB-INF/lib/opendolphin-reporting-2.7.1.jar` を置換し、再 Zip (`tmp/opendolphin-server-legacy-patched.war`) → `docker cp ... opendolphin-server:/opt/jboss/wildfly/standalone/deployments/opendolphin-server.war` → `.dodeploy` でホットスワップ。Legacy でも `/reporting/karte` が 200 となり PDF を返すようになった。

## 7. CLI 実行ログ（2025-11-13）

| RUN_ID | Locale | Legacy 応答 | Modernized 応答 | 証跡 |
| --- | --- | --- | --- | --- |
| `20251118TkarteJaZ1` | ja-JP | 200 / `X-Report-Locale: ja-JP` / `X-Trace-Id: 54aab8f5-2b5b-4f36-8b99-4d83830bc946` | 200 / `X-Report-Template: patient_summary` / `X-Trace-Id: 779c23c2-8eea-4a48-8c76-2f03cf1acd94` | `artifacts/parity-manual/reporting_karte_ja/20251118TkarteJaZ1/{legacy,modern}/response.pdf`、`pdffonts.txt`、`response.txt`、`diff.pdf`、`diff-pdf.log` を保存。`pdffonts` は両環境とも `NotoSansCJKjp-Regular-Identity-H` が `emb=yes` で登録され、改行用 `Helvetica`（非埋め込み）が 1 行残る。 |
| `20251118TkarteJaZ2` | en-US | 200 / `X-Report-Locale: en-US` / `X-Trace-Id: 7ba7b8cf-263f-42c7-b1db-dc70d528a0c8` | 200 / `X-Report-Template: patient_summary` / `X-Trace-Id: e6c30f32-4acf-4bb3-a523-192424b7c188` | `artifacts/parity-manual/reporting_karte_en/20251118TkarteJaZ2/...` へ ja 同様の証跡を保存。`diff-pdf --output-diff diff.pdf` では差分 0（ログ出力なし）。 |

- `pdftotext -layout` の抽出結果は `response.txt` として貼付し、ヘッダー/フッターのタイムスタンプやサマリ列挙がロケール別に期待どおりであることを確認した。
- `diff-pdf` は双方 1 ページで差分が無く、`diff.pdf` は空白ページとなる。今後テンプレート追加や署名設定を差し替える際は本 RUN_ID をベースラインとして扱う。
- `pdffonts` に `Helvetica`（非埋め込み）が残るのは `Chunk.NEWLINE` がデフォルトフォントを参照するためで、後続タスクでは `Chunk.NEWLINE` の代わりに `new Paragraph(\"\", bodyFont)` を追加して完全埋め込みを目指す。現状は本文テキストが `NotoSansCJKjp` に統一されていることを優先確認した。

- `tmp/reporting-headers/doctor.headers` は `1.3.6.1.4.1.9414.72.103:doctor1` / `doctor2025` へ更新済み。CLI で RUN_ID を指定しない場合は UTC タイムスタンプが自動付与されるが、Phase7-2 の証跡は `20251118TkarteJaZ{1,2}` 固定とする。

- 生成物に追記した README:  
  - `artifacts/parity-manual/reporting_karte_ja/README.md`（ja run のサマリ）  
  - `artifacts/parity-manual/reporting_karte_en/README.md`（en run のサマリ）
