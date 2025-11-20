# 03_API 契約最終化と設計更新

- RUN_ID: `20251120T055540Z`
- 期間: 2025-11-27 09:00 〜 2025-11-30 09:00 (JST)
- 優先度: High / 緊急度: Medium
- エージェント: cursor cli

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_ORCA_SPRINT2_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`

## スコープ / 非スコープ
- スコープ: モダナイズ版サーバーと Web クライアント間の REST 契約ドキュメント更新、OpenAPI 断片の整備、認可/セッション仕様とエラーコードの再整理。
- 非スコープ: `server/` 配下やサーバースクリプトの改修、Legacy `client/` `common/` `ext_lib/` の更新、Python スクリプト実行、WebORCA トライアル (`https://weborca-trial.orca.med.or.jp/`, BASIC=`trial`/`weborcatrial`) 以外への接続。

## ゴール
- `MODERNIZED_API_DOCUMENTATION_GUIDE` に沿って REST 契約の最新状態を整理し、破壊的変更を排除した合意版を提示する。
- Web クライアントが利用する認可/セッション仕様を再整理し、`AUTHORIZATION`/`SESSION`/`TRACE` 系の必須ヘッダーとタイムアウト・リトライ条件を明文化する。
- エラーコードをシンプルな共通表へ再統一し、HTTP ステータスとの対応と UI ハンドリング方針を揃える。
- ドメイン別 OpenAPI 断片をモジュール境界（Auth・Charts・Reception/Reservation・Administration/PHR・ORCA Wrapper）に整理し、再利用可能なスキーマ/共通レスポンスを切り出す。

## 期待アウトプット（DoD）
1. DoD-1: `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md` を RUN_ID=`20251120T055540Z` で更新し、契約更新対象・担当ドメイン・エビデンスログへの導線を追記。破壊的変更が残る場合は Blocker ラベルと暫定フォールバックを明記する。
2. DoD-2: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` / `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` / `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md` に、契約確定済みエンドポイントのステータスとエラーコード統一表へのリンクを反映する。
3. DoD-3: Web クライアント側の認可/セッション仕様と UI ハンドリングを `docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md` / `docs/web-client/process/API_UI_GAP_ANALYSIS.md` / `docs/web-client/architecture/PHASE2_SYSTEMS_ALIGNMENT.md` に同期し、セッション失効時のリトライ・再ログイン・監査ログ条件を揃える。
4. DoD-4: ドメイン別 OpenAPI 断片を `docs/server-modernization/phase2/operations/assets/openapi/<domain>/` に配置（または既存断片を更新）し、共通スキーマ/エラーレスポンスを `components` へ集約。モジュール境界と依存関係表を本ファイルに記載する。
5. DoD-5: RUN_ID を `DOC_STATUS.md` 備考と関連ログへ反映し、参照チェーン・禁止事項を満たした状態でワーカー報告テンプレへ転記できること。

## タスク分解
- **A. 契約クリーニング（ガイド追従）**
  - `MODERNIZED_API_DOCUMENTATION_GUIDE.md` の更新項目を洗い出し、規約違反（例: 標準ヘッダー欠如、404/405 例外ケース未定義）を一覧化。
  - 契約確定に必要な差分を `MODERNIZED_REST_API_INVENTORY.md` / `API_PARITY_MATRIX.md` に反映し、Breaking Change が残る場合は代替案（互換ハンドラ・バージョンタグ）の提示を記載。
  - Evidence ログ: `docs/server-modernization/phase2/operations/logs/20251120T055540Z-api-contract.md` を開設し、比較表・スクリーンショット・diff 摘要を格納。
- **B. 認可/セッション・エラーコード統一**
  - 認証フロー（JWT/Session/Basic）とヘッダー (`Authorization`, `X-Facility-Id`, `X-Access-Reason`, `X-Trace-Id` など) の必須/任意を整理し、失効時のリカバリー手順を Web クライアント仕様へ反映。
  - エラーコード→HTTP ステータス→UI ハンドリング（再試行/サインアウト/モーダル表示）を 1 表に集約し、ORCA Wrapper の固有コードも同表へ統合する。
  - セッション/エラー表は `docs/web-client/process/API_UI_GAP_ANALYSIS.md` と `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md` の両方へリンク。
- **C. ドメイン別 OpenAPI 断片整備**
  - ドメイン: Auth、Charts（Karte/Document/Observation）、Reception & Reservation（PVT/Appointment）、Administration & PHR、ORCA Wrapper（disease/tensu/stamp 等）を対象に断片を整理。
  - 共通 `components`（ErrorResponse, Paging, AuditMeta, FacilityUserContext など）を切り出し、断片間の依存を最小化する。
  - 断片とモジュール境界表を本ファイルに記載し、`MODERNIZED_API_DOCUMENTATION_GUIDE.md` と相互リンクさせる。

## 連携先・更新対象
- 契約・ガイド: `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`、`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`、`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md`
- ORCA ラッパー/実装メモ: `docs/server-modernization/phase2/domains/ORCA_REST_IMPLEMENTATION_NOTES.md`
- 認可/セッション・UI 同期: `docs/web-client/architecture/WEB_CLIENT_REQUIREMENTS.md`、`docs/web-client/architecture/PHASE2_SYSTEMS_ALIGNMENT.md`、`docs/web-client/process/API_UI_GAP_ANALYSIS.md`
- エラーコード・セキュリティ比較: `docs/server-modernization/phase2/domains/AUTH_SECURITY_COMPARISON.md`
- OpenAPI 断片: `docs/server-modernization/phase2/operations/assets/openapi/` 配下（ドメイン別に配置し README を更新）

## ログ・証跡運用
- ログファイル: `docs/server-modernization/phase2/operations/logs/20251120T055540Z-api-contract.md`（契約 diff、エラーコード統合表、OpenAPI 断片一覧）
- アーティファクト: `artifacts/api-contract/20251120T055540Z/`（必要に応じて diff・スクリーンショット・OpenAPI 生成物を保存）
- DOC_STATUS: Phase2 「モダナイズ/連携」行へ RUN_ID=`20251120T055540Z` を備考に記載し、ハブドキュメントに同日反映する。

## リスクと回避策
- ORCA Trial に依存する API は 404/405 が残存する可能性が高いため、`trialsite.md#limit` を根拠として Blocker を明示し、Modernized 側でのフォールバック（仕様ベース実装 or UI プレースホルダー）を決める。
- OpenAPI 断片のスキーマ重複が増えるリスクがあるため、共通 `components` を優先的に整備し、スキーマ差分は Evidence ログで管理する。
- 認可/セッションの要件変更が UI に影響するため、`API_UI_GAP_ANALYSIS.md` と `PHASE2_SYSTEMS_ALIGNMENT.md` を同時更新できる見積もりを確保する。
