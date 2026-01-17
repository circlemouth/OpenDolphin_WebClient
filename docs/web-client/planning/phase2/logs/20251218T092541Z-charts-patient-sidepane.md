# Charts: 患者サイドペイン（基本/保険/履歴）仕上げログ（RUN_ID=`20251218T092541Z`）

- 日時: 2025-12-18
- 対象: Charts（`PatientsTab` を患者サイドペイン相当として仕上げ）
- 目的: 閲覧中心の情報配置に揃え、編集は権限と `missingMaster`/`fallbackUsed`/`dataSourceTransition` で明確にガードし、差分と保存履歴（監査ログ）を UI で追跡できる導線を追加する。

## 変更サマリ
1. **閲覧中心 UI**
   - 重要情報ストリップ（患者名/患者ID/受付ID/保険/状態）を先頭へ追加し、クリックで基本/保険/差分へスクロール可能にした。
   - 基本/保険/履歴/差分をカード化し、読取りを既定に統一。

2. **編集ガード（権限 + master/tone）**
   - `missingMaster=true` / `fallbackUsed=true` / `dataSourceTransition!==server` の場合は、Patients への編集導線とメモ編集を disable し理由を表示。
   - role によるガード:
     - `doctor`/`nurse` のみ患者メモ編集を許可（それ以外は不可）。
     - `reception`/`system_admin` 系は Patients への基本/保険編集導線を許可（ただし `会計待ち/会計済み` は不可）。
   - 受付ステータスによるガード（`会計待ち` 以降は編集導線を停止）。

3. **差分表示（変更前/変更後）**
   - `変更前`: `Patients` API（`/orca/patients/local-search`）の取得結果をベースラインとして表示。
   - `変更後`: 現在表示中の値（この段階ではメモのローカル編集分を反映）を表示。
   - 差分行の強調/解除ボタンを追加し、監査ログクリックで差分へフォーカスできる導線を用意。

4. **保存履歴（監査ログ）導線**
   - `保存履歴` ボタンでモーダルを開き、`getAuditEventLog()` の最新 5 件（同一 patientId を優先）を表示。
   - 監査ログの `changedKeys` が取得できる場合は表示し、クリックで差分パネルへスクロールする。

5. **履歴導線整理（誤操作低減）**
   - 履歴タブを `直近3回` / `過去90日` / `全期間検索` に整理。
   - 履歴行クリックで encounter context を更新し、`DocumentTimeline` へフォーカス移動（`id=document-timeline`）する。

## 実装ファイル
- `web-client/src/features/charts/PatientsTab.tsx`
- `web-client/src/features/charts/styles.ts`
- `web-client/src/features/charts/DocumentTimeline.tsx`
- `web-client/src/features/charts/TelemetryFunnelPanel.tsx`
- `web-client/src/libs/telemetry/telemetryClient.ts`
- `web-client/src/features/patients/PatientsPage.tsx`（Charts→Patients の戻り導線を追加）
- `tests/e2e/charts-patient-sidepane.spec.ts`（Playwright スモーク追加）

## 検証
- `npm -C web-client run typecheck` : pass
- `npx playwright test tests/e2e/charts-patient-sidepane.spec.ts` : pass

## 既知の制限 / TODO
- 差分表示のベースラインは現状 `Patients` 一覧 API を流用しており、基本/保険の分離取得（`updatedAt/updatedBy`・版管理）に対応する API は未整備。
- 保存履歴は現状「UI 側の監査ログ（in-memory）」を参照しているため、サーバー側監査の永続履歴 UI とは別途統合が必要。
