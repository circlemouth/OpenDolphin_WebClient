# サーバーモダナイズ Phase 2 ハンドブック

Jakarta EE 10 / WildFly 33 への移行タスクに関わるドキュメントを、本ディレクトリに集約した。新規エージェントは以下の順序で資料を確認し、`PHASE2_PROGRESS.md` に進捗や判断を追記すること。

## ディレクトリ構成

```
phase2/
├─ foundation/      … 共通方針・ギャップ・依存計画
├─ domains/         … 認証・カルテ・予約・外部連携など機能領域別メモ
├─ operations/      … WildFly 設定、監視、メッセージング関連
└─ PHASE2_PROGRESS.md … フェーズ内の進捗・決定事項ログ
```

- `foundation/JAKARTA_EE10_GAP_LIST.md`  
  Jakarta EE 10 へ移行する際の必須対応をカテゴリ別に整理。全タスクの前提となる。
- `foundation/DEPENDENCY_UPDATE_PLAN.md`  
  BOM 再編・ライブラリ更新・ライセンス確認の手順と候補バージョン。
- `foundation/IMPACT_MATRIX.md`  
  移行影響と担当想定をまとめたマトリクス。優先度・オーナーのアサイン状況を随時更新。
- `domains/` 配下  
  認証 (`AUTH_SECURITY_COMPARISON.md`)、カルテ閲覧 (`JAKARTA_EE10_CHARTS_VIEW_IMPACT.md`)、カルテ CRUD (`KARTE_ORDER_JAKARTA_STATUS.md`)、予約通知 (`RESERVATION_BATCH_MIGRATION_NOTES.md`)、外部連携 (`EXTERNAL_INTEGRATION_JAKARTA_STATUS.md`) など、領域ごとの調査結果。
- `operations/` 配下  
  Micrometer 移行・WildFly 設定 (`WILDFLY33_MICROMETER_OPERATIONS_GAP.md`) や JMS 再導入メモ (`WORKER0_MESSAGING_BACKLOG.md`)。

## 新規エージェント向けチェックリスト

1. `foundation/` ドキュメントを通読し、未解決ギャップと依存更新方針を把握する。  
   - 特に `JAKARTA_EE10_GAP_LIST.md` と `DEPENDENCY_UPDATE_PLAN.md` の ✅ / ⚠️ を確認。
2. 自分が担当する領域のメモ（`domains/`）を読み、未移植箇所・推奨アクション・参照コード位置を整理する。
3. 運用面の課題（Micrometer 置換、JMS 設定）に影響する場合は `operations/` を参照し、CLI 編集やドキュメント更新が必要か判断する。
4. 着手前に実施するタスク・質問事項を `PHASE2_PROGRESS.md` へ追記し、オーナーと期限を明記する。

## 推奨アクション（2025-11-02 時点）

- `common/pom.xml` と共通エンティティの Jakarta API 化（Java 17 対応、`jakarta.persistence` 置換）。
- `web.xml` / `beans.xml` / `persistence.xml` の Jakarta EE 10 スキーマ更新。
- BOM 再編（Plivo 5.46.0、OkHttp 5.2.1、Yubico WebAuthn 2.6.0、OpenPDF/BouncyCastle 最新版）とライセンス対応。
- WildFly 33 用 `configure-wildfly.cli` の Micrometer / JMS 再定義。
- Elytron/Jakarta Security ベースの認証方式再設計と Secrets 管理方針の確定。

詳細はそれぞれのドキュメントに記載の TODO や ✅/⚠️ ラベルを参照すること。

## ドキュメント更新ルール

- 変更・新規作成時は必ず `PHASE2_PROGRESS.md` に日付・担当者・概要を追記する。
- Web クライアント側から参照される資料は `docs/web-client/README.md` の「最新トピック」にリンクを追加する。
- ドキュメント間のリンクは相対パスで記述し、移動が発生した場合は本 README と関連資料を同時に更新する。
