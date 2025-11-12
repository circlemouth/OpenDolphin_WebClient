# Maven DuplicateProjectException 解消計画

## 背景
- ルート `pom.xml` が `server`（Legacy）と `server-modernized` を同一リアクターに含めているが、両サブモジュールが同一 GAV（`opendolphin:opendolphin-server:2.7.1`）を宣言しているため、`mvn -pl server-modernized ...` のように特定モジュールだけを呼び出しても Maven 初期化時に `DuplicateProjectException` で停止する。
- 再現ログは `artifacts/parity-manual/build/duplicate_project/mvn-help-effective-pom.log` に保存済み。help/validate/compile いずれのゴールでも同例外が先に発生し、Modernized 側の静的解析や WAR ビルド手順を実行できない。

## 現状整理
- `server/pom.xml:14` と `server-modernized/pom.xml:14` が同じ `<artifactId>opendolphin-server</artifactId>` を宣言し、親バージョンも `2.7.1` で一致。依存管理 (`pom.xml:34-52`) でも同 GAV の WAR が 1 つだけ想定されている。
- `scripts/start_legacy_modernized.sh:158-187`／`tmp/wildfly_build.log`／`docker-compose.modernized.dev.yml` が `server-modernized/target/opendolphin-server-*.war` → `opendolphin-server.war` をコピーする前提で書かれており、WAR ファイル名を変えても最終成果物名は `opendolphin-server.war` のまま保つ必要がある。
- CI/静的解析（`pom.server-modernized.xml` プロファイルや `ops/analytics/evidence/nightly-cpd/*`）では Modernized のみをビルドするケースが多いが、開発者はルート `pom.xml` から `mvn -pl server-modernized ...` を実行する癖がついており、今回のように失敗する。

## 修正案

### 案A: Modernized モジュールの artifactId を変更
1. `server-modernized/pom.xml` の `<artifactId>` を `opendolphin-server-modernized` に変更し、`<name>` や `<description>` もモダナイズ版であることを明示する。
2. ルート `pom.xml` と `pom.server-modernized.xml` の `<dependencyManagement>`／`<modules>` で新 artifactId を参照する。`dependencyManagement` 側には Legacy/Modernized それぞれの WAR を分けて定義し、必要に応じて `type>war</type>` を並記する。
3. Docker/スクリプト類（`scripts/start_legacy_modernized.sh`, `docker/wildfly/Dockerfile.*`, `tmp/wildfly_build.log` ベースの手順書）で `server-modernized/target/opendolphin-server-modernized-*.war` をコピー後、`<finalName>` もしくは `mv` で最終ファイル名を `opendolphin-server.war` に揃える。`server-modernized/pom.xml` に `<build><finalName>opendolphin-server</finalName></build>` を追加すれば差分を最小化できる。
4. `reporting` など Modernized WAR を `pom` から直接参照している箇所があれば `artifactId` を更新し、`mvn dependency:tree -pl reporting` で解決状況を確認する。

### 案B: Modernized 系を専用リアクターへ分離
1. ルート `pom.xml` の `<modules>` から `server-modernized` を除外し、Modernized ビルドは既存の `pom.server-modernized.xml` をエントリーポイントに限定する。
2. Jenkins/CI/ローカル手順を `mvn -f pom.server-modernized.xml ...` へ統一し、ルート側では `server` だけが `opendolphin-server` を名乗るようにする。
3. Web クライアントや parity 系ツールが `mvn -pl server-modernized ...` を前提にしている箇所（README、Runbook、スクリプト）を洗い出し、`-f pom.server-modernized.xml` を明示的に付けるよう修正する。
4. デメリットとして、ルート `mvn -am` で Legacy/Modernized を同時ビルドできなくなるため、長期的には案Aで artifactId を分けた上で再統合することを推奨。案Bは暫定回避策として検討する。

## 影響範囲・懸念
- **CI/ビルドパイプライン**: `Jenkinsfile` や `scripts/start_legacy_modernized.sh` 内の `mvn -pl server-modernized` 呼び出しはすべて更新が必要。特に `ops/analytics/evidence/nightly-cpd/` から参照するビルドログや `tmp/wildfly_build.log` を生成する `docker build` 手順では WAR 名と artifactId を固定文字列で扱っているため、脚本変更を伴う。
- **依存関係**: `pom.xml` の `dependencyManagement` に `opendolphin-server` が 1 つしかないため、Modernized 側の dependency scope をどう扱うか決める必要がある。案A では Legacy/Modernized の依存定義を 2 つ並べ、必要に応じて `classifier`（legacy/jakarta）を導入する。本決め前に `common` / `reporting` がどちらの WAR に依存しているか再確認する。
- **ドキュメント/Runbook**: `docs/server-modernization/phase2/notes/domain-transaction-parity.md §3.5`, `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`, `PHASE2_PROGRESS.md` へ今回のブロッカーと対処計画を明記済み。修正実装後は同セクションを「解消済み」に更新し、`DOC_STATUS.md` に成果物リンクを追加する。
- **互換性試験**: ArtifactId 変更後は `ops/tools/send_parallel_request.sh` や WildFly ベースの deploy スクリプトで WAR を再配置できるかを再検証し、`artifacts/parity-manual/build/duplicate_project/` に再発防止ログを残す。

