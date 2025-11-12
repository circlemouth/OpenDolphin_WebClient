# 共通モジュール共有方針サマリ（2025-11-12）

## 目的
- `opendolphin-common` を Legacy/Modernized サーバーおよび Swing クライアントで同一 JAR として維持する理由を一点に集約し、同種の質問を受けた際に参照できる索引を提供する。

## 根拠ドキュメント
1. `docs/server-modernization/phase2/notes/domain-transaction-parity.md`「共通モジュール運用方針」: DTO/JPA パリティと `-jakarta` classifier 併産の手順を定義。
2. `docs/web-client/architecture/REPOSITORY_OVERVIEW.md` Modules セクション: Web クライアント視点での共有ルールと `common` 複製禁止理由を記載。
3. `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（2025-11-12 追記）: 分離案を却下した経緯と再検討条件（Swing 廃止、Java バージョン差異、DTO バイナリ互換性崩壊時）。

## 運用メモ
- Modernized サーバーは `common/pom.xml` の `jakarta-no-persistence` 実行で生成される `opendolphin-common-<version>-jakarta.jar` を使用し、Legacy/Swing は classifier なし版を利用する。
- DTO 追加・フィールド変更を実施する際は、`docs/server-modernization/phase2/notes/domain-transaction-parity.md` の証跡テンプレと `docs/web-client/planning/phase2/DOC_STATUS.md`（Architecture/Notes 行）にエントリを残し、Binary 互換性審査を同時に申請する。
- 再検討条件のいずれかが成立したら、本ファイルを更新して対応タスク ID と決定プロセスを追記する。
