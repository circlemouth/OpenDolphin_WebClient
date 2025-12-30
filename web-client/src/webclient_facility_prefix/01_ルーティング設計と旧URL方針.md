# 01 ルーティング設計と旧URL方針

- RUN_ID: `20251230T022214Z`
- Parent RUN_ID: `20251229T220416Z`
- YAML ID: `web-client/src/webclient_facility_prefix/01_ルーティング設計と旧URL方針.md`

## 方針サマリ
- ルートは `/f/:facilityId/*` に集約する。
- `/login` は **直アクセスを許可**し、未ログイン時はログイン画面を表示する。
- 旧URL（facility prefix なし）へのアクセスは **互換リダイレクト**で `/f/:facilityId/*` へ集約する。

## `/login` 直アクセス時の挙動
1. **未ログイン**: ログイン画面を表示する。
2. **ログイン済み**: `/f/:facilityId/reception` に誘導する。
3. **ログイン誘導元がある場合**: `location.state.from` を尊重し、**同一 facilityId に正規化**したパスへ復帰する。

## 旧URLの扱い（facility prefix なし）
- 旧URLは **ルーティング互換**として残し、アクセス時に `/f/:facilityId/*` へリダイレクトする。
- 例: 
  - `/reception` → `/f/:facilityId/reception`
  - `/charts` → `/f/:facilityId/charts`
  - `/charts/print/outpatient` → `/f/:facilityId/charts/print/outpatient`
  - `/patients` → `/f/:facilityId/patients`
  - `/administration` → `/f/:facilityId/administration`
  - `/outpatient-mock` → `/f/:facilityId/outpatient-mock`
- **未ログイン**で旧URLに到達した場合は `/login` に送る。
- `facilityId` がログイン情報と不一致の場合は、**セッションの facilityId を正として再誘導**する。

## 主要画面の遷移先（/f/:facilityId に統一）
- Reception → Charts: `/f/:facilityId/charts`（runId と carryover を維持）
- Charts → Patients: `/f/:facilityId/patients`（returnTo を facility 付きで保持）
- Charts 印刷: `/f/:facilityId/charts/print/outpatient` / `/f/:facilityId/charts/print/document`
- Administration / Outpatient Mock: `/f/:facilityId/administration`, `/f/:facilityId/outpatient-mock`

## 実装メモ
- `/f/:facilityId/*` を AppRouter の主要ルートとし、旧URLは LegacyRootRedirect で施設付きパスへ正規化。
- 画面内遷移や deep link は `buildFacilityPath()` を介して `/f/:facilityId/*` に統一。
- `buildChartsUrl` に `basePath` を追加し、Charts/Patients の returnTo を施設付きで生成。
