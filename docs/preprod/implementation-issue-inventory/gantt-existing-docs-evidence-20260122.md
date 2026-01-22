# ガント計画 既存ドキュメント証拠マップ

- 作成日: 2026-01-22
- RUN_ID: 20260122T102944Z
- 対象ガント: `.kamui/apps/orca-preprod-implementation-issue-inventory-plan-20260122.yaml`
- 目的: 既存の開発ドキュメントで **完遂済み/新規作成不要** と判断できるタスクを明示し、証拠への導線を残す。
- 注意: Phase2 ドキュメントは Legacy/Archive。**現行ルールの正本ではない**が、過去実施の証拠として参照する。

---

## 1. Web クライアント棚卸し

### 1.1 画面遷移と患者フロー棚卸し
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/01_画面遷移と患者フロー棚卸し.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`
  - `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`
- 理由:
  - Reception → Charts → Patients の遷移/ガード/returnTo/セッション保持を網羅的にレビュー済み。
  - 本番ナビ/ルーティング/ガードの確定事項が明文化されている。

### 1.2 APIクライアントと型整合棚卸し
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/01_webclient_review/02_APIクライアントと型整合棚卸し.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `docs/web-client/architecture/web-client-api-mapping.md`
  - `docs/server-modernization/api-architecture-consolidation-plan.md`
- 理由:
  - Web クライアントの API マッピングと runId/traceId/Api_Result 透過ルールが明文化済み。
  - サーバー側の API 統合計画と差し替え対象が整理済み。

---

## 2. server-modernized 棚卸し

### 2.1 API実装一覧と仕様差分
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/01_API実装一覧と仕様差分.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `docs/server-modernization/api-architecture-consolidation-plan.md`
  - `docs/server-modernization/server-modernized-code-review-20260117.md`
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
- 理由:
  - API 体系の整理（旧互換廃止/新 API 正本）と実装差分が整理済み。
  - code review にて未解決事項と解消済み差分が整理済み。

### 2.2 入力バリデーションとエラー変換
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/02_server_modernized_review/03_入力バリデーションとエラー変換.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `src/validation/入力バリデーション妥当性確認.md`
  - `src/validation/入力バリデーション差分再確認と文書更新.md`
- 理由:
  - 病名/処方/オーダー束の validation 差分とエラー表示の整合を検証済み。
  - 差分解消までの再確認結果が明文化されている。

---

## 3. ORCA 連携棚卸し

### 3.1 ORCA公式APIカバレッジ
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/01_ORCA公式APIカバレッジ.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `docs/server-modernization/phase2/operations/logs/20260111T213428Z-orca-trial-coverage.md`（Legacy/Archive: 実測ログとして参照）
  - `docs/server-modernization/orca-additional-api-implementation-notes.md`
- 理由:
  - Trial 実測ログにより対応/未対応/制約 API が一覧化されている。
  - 追加実装済み API の一覧と仕様ルールが整理済み。

### 3.2 XMLプロキシと変換ロジック
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/02_XMLプロキシと変換ロジック.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `src/orca_xml_proxy/03_ORCA公式XMLプロキシ実装.md`
  - `docs/DEVELOPMENT_STATUS.md`（2026-01-14 の実施記録）
- 理由:
  - XML プロキシの送受信・エラー表示・runId/traceId 透過まで実装/検証済み。
  - 受け入れ条件と対象 API が明文化されている。

### 3.3 JSONラッパーと内製ラッパー
- 対象タスク: `src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/03_JSONラッパーと内製ラッパー.md`
- 判定: **完遂（既存ドキュメントで代替可能）**
- 証拠:
  - `src/orca_wrapper_json/01_予約受付請求試算_JSONラッパー実装.md`
  - `src/orca_wrapper_json/02_患者同期_JSONラッパー実装.md`
  - `src/orca_internal_wrapper/04_ORCA内製ラッパー_stub混在対応.md`
  - `docs/DEVELOPMENT_STATUS.md`（2026-01-14 の実施記録）
- 理由:
  - 予約/受付/患者同期/内製ラッパーの実装範囲・受け入れ条件が文書化済み。
  - runId/traceId/監査メタ透過の要件が明記されている。

---

## 4. 更新ルール
- 本マップに記載されたタスクは、ガント側を **完了扱い** とする。
- 追加の差分が発生した場合は、`docs/preprod/implementation-issue-inventory/issue-catalog.md` に追記し、必要ならタスクを再オープンする。
