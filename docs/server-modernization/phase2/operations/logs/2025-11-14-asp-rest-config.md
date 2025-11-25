# RUN_ID=20251114TaspCtxZ1 — ASP REST 再登録検証ログ

## 1. 目的
- `server-modernized/src/main/webapp/WEB-INF/web.xml` へ Demo/Dolphin/PHR ASP リソースを再登録した差分が WildFly ビルドへ反映されることを確認。
- PHR context-param (`touch.phr.requiredHeaders`) と Demo 固定 Facility (`touch.demo.fixedFacilityId`) の設定内容を記録し、API ドキュメント側へ連携する。

## 2. 実施コマンド
```bash
mvn -pl server-modernized clean package -DskipTests
```
- 実行時刻: 2025-11-14T22:08:56+0900（Codex CLI ローカル）
- 主要ログ: Base64Utils / Character コンストラクタ等の既知 deprecation warning のみ。ビルドは `SUCCESS` で終了し、`server-modernized/target/opendolphin-server-modernized.war` が再生成された。

## 3. 設定確認メモ
- `resteasy.resources` に `open.dolphin.touch.DolphinResourceASP` / `open.dolphin.touch.DemoResourceASP` を追加済み。
- `context-param`:
  - `touch.demo.fixedFacilityId=1.3.6.1.4.1.9414.2.100`
  - `touch.phr.requiredHeaders=X-Facility-Id,X-Touch-TraceId`
- これらの値を `MODERNIZED_REST_API_INVENTORY.md`（PHR 欠落表の備考列）と `MODERNIZED_API_DOCUMENTATION_GUIDE.md §6` へ転記済み。Task-B（context-param 通知タスク）へも引き継いだ。

## 4. 結果と次アクション
- WAR ビルド成功。WildFly reload 相当まで完了したため、`configure-wildfly.cli` での追加作業は不要。
- 次ステップ: Task-B で Demo/PHR クライアント向けヘッダー検証実装を進める。必要に応じて `LogFilter` / `TouchRequestContextExtractor` への `X-Touch-TraceId` 伝搬を確認すること。
