# 影響範囲マトリクス（更新日: 2025-11-02）

Jakarta EE 10 移行に伴う影響領域を業務視点で整理したマトリクス。優先度は High / Medium / Low で示し、関連ファイルとフォロー先を記載する。

| 領域 | 影響内容 | 優先度 | 関連ファイル | フォロー先メモ |
| --- | --- | --- | --- | --- |
| 永続化層 (`opendolphin-common`) | `javax.persistence` / Java 8 前提のまま。Jakarta 変換と Hibernate 6化が必要。 | High | `common/pom.xml:17-55`<br>`common/src/main/resources/META-INF/persistence.xml:2-12` | Persistence チーム（Worker B）: 変換用スクリプトとマイグレーションテスト計画を策定。 |
| REST 層 (`server-modernized`) | `web.xml`・`beans.xml` のスキーマ更新と `jakarta.json` 依存追加が未対応。 | High | `server-modernized/src/main/webapp/WEB-INF/web.xml:2-7`<br>`beans.xml:2-4` | API/REST 担当（Worker D）: スキーマ更新後に Smoke テストを再実施。 |
| 外部連携（Plivo / WebAuthn） | OkHttp 依存未追加、Plivo SDK バージョン不整合、Yubico ライブラリ更新待ち。 | High | `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java:23-155`<br>`server-modernized/pom.xml:83-95` | 外部連携担当（Worker F）: SDK バージョン決定と運用チームへの通達。 |
| オブザーバビリティ | Micrometer ベースの計測実装と CLI 連携は完了。Prometheus 管理ポートのアクセス制御、Grafana/Alert ルール更新、監査ログとの突合運用が残課題。 | High | `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`<br>`docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md`<br>`server-modernized/src/main/java/open/dolphin/metrics/*.java` | SRE チーム（Worker H）: 2025-11-06 までにアクセス制御・ダッシュボード・突合手順をレビューし、`PHASE2_PROGRESS.md` へ進捗追記。 |
| JMS / メッセージング | `java:/queue/dolphin` 定義が未整備のほか、`MessageSender` がスタブ化され `MessagingGateway` の `ManagedExecutorService` 依存も未検証。 | High | `server-modernized/src/main/java/open/dolphin/session/MessageSender.java`<br>`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`<br>`docker/server-modernized/configure-wildfly.cli` | インテグレーション担当（Worker G）: ActiveMQ 設定案と executor 配備を確定し、CLAIM/PVT 連携の非同期経路を再検証。 |
| Docker / ビルドパイプライン | Hibernate 5 互換 JAR を手動生成。Jakarta 移行後のビルド手順を更新する必要がある。 | Medium | `docker/server-modernized/Dockerfile:16-75` | DevOps チーム（Worker C）: 互換 JAR 廃止に伴う CI 更新を計画。 |
| ドキュメント | 既存ガイドが WildFly 26 前提。Jakarta 移行後の運用手順へ更新が必要。 | Medium | `docs/server-modernization/*`, `docs/web-client/README.md` | ドキュメント担当（Worker A）: 更新履歴と参照先を整理。 |

## 次のアクション

1. High Priority の 4 項目について担当者を確定し、各チームで着手可否と工数見積もりを 2025-11-04 までに共有する。
2. Medium Priority は High の進捗に合わせてフェーズ 2 のバックログへ積み替える。特に JMS 設定は REST 層検証前にドラフトを準備する。
3. 本マトリクスは `PHASE2_PROGRESS.md` の週次レビューで更新し、完了済みの行には ✅ を付与する。
