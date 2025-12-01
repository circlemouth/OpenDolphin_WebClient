# Playwright フィクスチャ配置方針（RUN_ID=20251202T090000Z）

- 目的: Reception/Charts/Patients-Admin シナリオで必要な前提データ・モックレスポンスを共通管理し、権限制御や ORCA キュー切替を安定させる。
- 配置例:
  - ロール別ユーザー/トークン: `auth/roles.json` などで role=system_admin/受付/医師を定義。
  - ORCA 送信キュー: 成功/遅延/エラーのモックレスポンスを `orca/queue/*.json` で用意し、`VITE_USE_MOCK_ORCA_QUEUE` と連動させる。
  - 設定配信 API: 即時/遅延/失敗のレスポンスを `admin/delivery/*.json` に配置し、配信タイミング検証に利用。
  - 監査ログ: `audit/*.json` に最小限のログ例を置き、`fetchAuditLog` の期待スキーマをテストで参照。
- 運用: 実データはコミットせず、必要に応じてローカル生成/シークレット管理。フィクスチャは Playwright の config で読み込み、各シナリオの前提データ欄と整合させる。
- 追加で必要なフィクスチャ候補:
  - Reception 用受付一覧（診療科/時間帯/ステータス差分）: `reception/queues.json`
  - Charts 用患者データ（保険/自費モード、オーダーエラーを返すモック）: `charts/patients.json`, `charts/orders-error.json`
  - Patients/Admin 用権限差分データ（閲覧専用/編集可の設定配信）: `admin/settings-readonly.json`, `admin/settings-editable.json`
  - localStorage ベースのフィルタ初期値: `filters/reception.json`（`restoreFilters` が参照する key と揃える）
  - 監査ログ API モック: `audit/entries.json`（runId/operation でフィルタできる簡易形式）

## 最小フィクスチャセット（RUN_ID=20251202T090000Z）
- `auth/roles.json`: admin/reception/doctor のロール別ユーザー。
- `orca/queue/mock-success.json` / `orca/queue/live-fallback.json`: モック ON/OFF のキュー差分を返すサンプル。
- `admin/delivery/verification-enabled.json` / `verification-bypass.json`: 配信検証フラグ有無のレスポンス。
- `audit/entries.json`: ORCA キューと Administration 配信の監査ログ例。
