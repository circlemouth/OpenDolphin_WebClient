# テストカバレッジと未実施一覧

- 作成日: 2026-01-22
- RUN_ID: 20260122T184901Z
- 対象: ORCA preprod 実装棚卸し（テストレビュー）
- 参照（正本）:
  - `src/validation/E2E_統合テスト実施.md`
  - `docs/web-client/architecture/web-client-navigation-review-20260119.md`

---

## 実施済みカバレッジ（証跡あり）

### 1. E2E / 統合テスト（非カルテ主要フロー）
- 実行 RUN_ID: `20260103T235314Z`
- 実行日: 2026-01-04 (UTC/JST)
- 実行範囲:
  - Reception: 例外一覧 / キュー状態 / 監査検索
  - Patients: 反映状態（未紐付警告）/ 監査検索
  - Charts: 送信 / 印刷ガード表示 / 復旧導線（再取得）
  - Administration: 配信状態 / ガード / 監査イベント（admin セッション）
- 証跡:
  - `artifacts/validation/e2e/logs/`（ログ）
  - `artifacts/validation/e2e/screenshots/`（スクリーンショット）
  - `artifacts/validation/e2e/README.md`（サマリ/runId）
- 備考: WebClient は MSW ON で実行。

### 2. ナビゲーション/セッション共有の回帰テスト（2026-01-20）
- 単体/結合:
  - `httpClient.test.ts` / `sessionExpiry.test.ts` に 401/419/403 失効判定と BroadcastChannel 連携テストを追加済み
- E2E:
  - Playwright: `tests/e2e/navigation-broadcast.spec.ts`
  - 実行: `RUN_ID=20260120T061247Z npx playwright test tests/e2e/navigation-broadcast.spec.ts --reporter=list`
  - 成果物: `test-results/tests-e2e-navigation-broad-*/trace.zip`
- サブパス配信確認:
  - `web-client/scripts/verify-subpath-preview.mjs`
  - `VITE_BASE_PATH=/foo npm run test:subpath-preview` で `/foo/` と `/foo/f/0001/reception` の 200 を確認
- UAT チェック:
  - BroadcastChannel runId 同期 / session-expired ブロードキャスト / サブパス配信の直接リロード

---

## 未実施・不足しているテスト（要棚卸し）

### 未実施 API / 結合テスト
- server-modernized 実装 API の実呼び出し結合テストが不足
  - E2E は MSW ON で実施されており、実 API 連携の網羅性は未担保
- ORCA 公式 API / XML プロキシ / JSON ラッパー / 内製ラッパーを含む実環境連携テストが未実施
  - ORCA Trial/本番相当での API 結合テスト証跡が無し
- 監査ログ API（保存・検索）の実 API 経路の結合テストが未実施

### 未検証 UI / 画面操作
- ログイン成功時の即リダイレクト（/f/{facilityId}/reception）
- 403 応答時の権限不足バナー/トースト表示（強制ログアウトしない）
- 新規タブからの直接 URL 起動時に、認証・runId・authFlags が復元されること
- ログアウト後のストレージ一括掃除（facilityId:userId スコープ）の検証
- 複数タブでの失効イベント同期の UI 体験（メッセージ一致/デバウンス）

### 証跡不足（監査ログ/結果記録）
- E2E 実行ログは `20260103T235314Z` の1回分のみ
  - 直近変更（2026-01-20 以降）のスクリーンショット/監査ログの再取得が未実施
- Playwright の HAR/スクリーンショットの保存先がドキュメントに紐付いていない
- 監査ログの「UI 表示」以外（永続化先・検索 API）の証跡が不足

---

## 補足（次の検証で必要な前提）
- 実 API 結合テストを行う場合は `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を用い、監査ログ保存先を事前に準備すること
- ORCA 実環境接続は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（Legacy）に従い、ログを保存すること
