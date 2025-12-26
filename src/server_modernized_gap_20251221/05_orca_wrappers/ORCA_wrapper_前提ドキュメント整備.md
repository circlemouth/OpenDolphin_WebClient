# ORCA_wrapper_前提ドキュメント整備
- 期間: 2025-12-24 16:00 - 2025-12-25 16:00 / 優先度: medium / 緊急度: high
- YAML ID: `src/server_modernized_gap_20251221/05_orca_wrappers/ORCA_wrapper_前提ドキュメント整備.md`

## 目的
- Spec-based API 解放に必要な前提資料（対象 API / 期待レスポンス / 互換レイヤー条件 / 監査項目）を先行整備する。
- ORCA wrapper の切替条件と監査要件の参照リンクを一本化し、実装タスクの着手準備を揃える。

## 前提・制約
- Phase2 文書は Legacy/Archive（参照専用）。更新対象外。
- 旧サーバー資産（`server/`）は変更禁止。
- 変更対象は Web クライアント資産と `server-modernized/` のみ。
- モダナイズ版サーバーと Web クライアントは `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` で起動し、認証情報はスクリプト記載のものを使用する。
- ORCA 実環境に接続する場合は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の RUN_ID ルールに従う。

## 参照リンク（現行）
- `docs/DEVELOPMENT_STATUS.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `docs/server-modernization/server-api-inventory.md`
- `src/server_modernized_gap_20251221/00_factcheck/現状棚卸し_ギャップ確定.md`
- `src/predeploy_readiness/02_feature_implementation/エラーハンドリング・リトライ整備.md`
- `src/predeploy_readiness/02_feature_implementation/バリデーション・スキーマ整備.md`
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/ux/config-toggle-design.md`
- `docs/web-client/operations/debugging-outpatient-bugs.md`
- `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java`
- `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaTransport.java`
- `server-modernized/src/main/java/open/dolphin/orca/transport/StubOrcaTransport.java`
- `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaEndpoint.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaAppointmentResource.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaVisitResource.java`
- `server-modernized/src/main/java/open/dolphin/orca/rest/OrcaPatientBatchResource.java`
- `server-modernized/src/main/java/open/orca/rest/OrcaResource.java`
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`

## 参照リンク（Legacy/Archive）
- `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md`
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
- `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`
- `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md`
- `docs/server-modernization/phase2/operations/logs/20251123T130134Z-webclient-api-compat.md`
- `docs/server-modernization/phase2/operations/logs/20251120T191203Z-docinfo-orca-indexoutofbounds-issue.md`
- `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`

## 作業手順書（ORCA wrapper 前提整備）
1. `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` の ORCA wrapper 項目を確認し、対象 API と P0/P1/P2 の優先度を整理する。
2. `OrcaWrapperService` / `OrcaTransport` / `StubOrcaTransport` の責務を棚卸しし、Spec-based API 解放時に切り替えるべき transport の前提条件を明記する。
3. `open/dolphin/orca/rest` 配下の Resource 群（予約・来院・バッチ）と実際の ORCA API 仕様の対応表（API 名 / HTTP メソッド / パス / DTO / 期待レスポンス）を整理する。
4. 互換レイヤー（`X-Client-Compat: orca-certification` 等）によるステータス正規化・`apiResult` 補完の前提を Legacy ログから抽出し、Spec-based API 解放時の移行条件を一覧化する。
5. 監査イベントの期待形（`runId` / `traceId` / `missingMaster` / `fallbackUsed` / `dataSourceTransition` など）を `web-client-api-mapping.md` で確認し、ORCA wrapper で不足している監査項目を整理する。
6. 4xx/5xx のエラーレスポンス形式と監査ログ記録ルールを `predeploy_readiness` のガイドに照らして整理し、未整備箇所の TODO を明示する。
7. 監査実装の参考として `OrcaMasterResource` の監査記録（`SessionAuditDispatcher`）を確認し、ORCA wrapper 側の実装指針に反映する。

## 切替条件/監査要件リンク整理
- 互換レイヤー条件: `docs/server-modernization/phase2/operations/logs/20251123T130134Z-webclient-api-compat.md`
- 404/405→200+`apiResult` 正規化の根拠: `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md`
- 監査メタ項目の一覧: `docs/web-client/architecture/web-client-api-mapping.md`
- 監査ログ検証の手順: `docs/web-client/operations/debugging-outpatient-bugs.md`
- 切替前後の運用トグル設計: `docs/web-client/ux/config-toggle-design.md`

## 期待成果物
- ORCA wrapper の前提資料（対象 API / 期待レス / 互換条件 / 監査項目）をまとめた本ドキュメント。
- Spec-based API 解放の切替条件（互換ヘッダー/エラーマップ/監査イベント）を関係タスクへ展開できる状態。

## 非対象
- Phase2/Legacy 文書の更新。
- ORCA 実接続・Stage/Preview 実測。
- 旧サーバー（`server/`）の改修。
