# server-modernized コードレビュー（API統合計画対応）

**レビュー日**: 2026-01-17  
**RUN_ID**: 20260117T224649Z  
**追記日**: 2026-01-17  
**追記RUN_ID**: 20260117T230508Z  
**対象ドキュメント**: `docs/server-modernization/api-architecture-consolidation-plan.md`

---

## 1. レビュー範囲

- サーバー: `server-modernized/src/main/java/open/dolphin/orca/rest/*` / `server-modernized/src/main/java/open/dolphin/rest/dto/orca/*` / `server-modernized/src/main/webapp/WEB-INF/web.xml`
- クライアント: `web-client/src/features/{reception,patients,outpatient,chats}/` / `web-client/src/libs/http/httpClient.ts`
- モック/テスト: `web-client/src/mocks/*` / `server-modernized/src/test/java/*`
- 検証証跡: `artifacts/api-architecture-consolidation/20260117T220347Z/`

---

## 2. 解決済み（問題解消を確認）

1. **旧互換ラッパー削除**
   - `AppointmentOutpatientResource` / `OutpatientClaimResource` / `PatientOutpatientResource` を削除し、旧 `/api01rv2/*/outpatient` を排除。
   - 新エンドポイントへ置換済み。

2. **新 API の実装と配線**
   - `/orca/claim/outpatient` と `/orca/patients/local-search` を新規実装。
   - `/orca/appointments/*` と `/orca/visits/*` を現行 ORCA wrapper として統合。
   - `web.xml` の `resteasy.resources` に新リソースを登録。

3. **クライアント側の一括置換**
   - `httpClient` と `Reception/Patients/Charts` の API 呼び出しを新パスへ差し替え。
   - MSW/Playwright のモック経路を新パスへ更新。

4. **監査ログ/トレース連携の復旧**
   - `/orca/claim/outpatient` と `/orca/patients/local-search` は `SessionAuditDispatcher` 経由で監査イベント送出を確認。
   - `artifacts/api-architecture-consolidation/20260117T220347Z/audit-log-snippet.txt` に JMS 送信ログを確認。

5. **旧 API 未呼び出し検証の実施**
   - 証跡内で旧互換ラッパー呼び出しが出ていないことを確認。
   - `artifacts/api-architecture-consolidation/20260117T220347Z/legacy-api-check.txt` を根拠。

---

## 3. 未解決（要対応）

### 3.1 `dataSourceTransition` が `real/stub` になる → 解消確認済み

- **事象**: `/orca/appointments/list` と `/orca/visits/list` の `dataSourceTransition` が `real` (または `stub`) を返す。
- **根拠**:
  - `server-modernized/src/main/java/open/dolphin/orca/rest/AbstractOrcaWrapperResource.java#L101`
  - `artifacts/api-architecture-consolidation/20260117T220347Z/appointments-list.json`
  - `artifacts/api-architecture-consolidation/20260117T220347Z/visits-list.json`
- **影響**:
  - UI は `dataSourceTransition === 'server'` で権限・編集可否を判定しているため、`real` だと **編集ブロック/警告トーン** が誤発火する。
- **本番運用方針（推奨）**:
  - `dataSourceTransition` は **UI/監査/テレメトリの判定キー** として固定語彙（`server|snapshot|mock|fallback`）に統一する。
  - ORCA 側の接続モードは `dataSource=real/stub` として **別枠の診断情報** に保持し、UI 判定に混ぜない。
- **実装方針**:
  1. `AbstractOrcaWrapperResource#applyResponseMetadata` で `dataSourceTransition` を **常に `server`** へ正規化（`response.getDataSource()` を転用しない）。
  2. `orcaMode` は既存の監査 details（`applyResponseAuditDetails`）に残す。
  3. これにより、UI 側の `dataSourceTransition` 判定は現行ロジックのまま維持する。

**再検証（RUN_ID=20260117T235100Z）**:
- `/orca/appointments/list` / `/orca/visits/list` のレスポンスで `dataSourceTransition=server` を確認。証跡: `artifacts/api-architecture-consolidation/20260117T235100Z/appointments-list.json` / `artifacts/api-architecture-consolidation/20260117T235100Z/visits-list.json`
- 監査ログ（JMS → d_audit_event payload）で `dataSourceTransition=server` を確認。証跡: `artifacts/api-architecture-consolidation/20260117T235100Z/audit-event-payload.txt` / `artifacts/api-architecture-consolidation/20260117T235100Z/audit-log-snippet.txt`

---

### 3.2 `recordsReturned` が `/orca/appointments/list` / `/orca/visits/list` に存在しない → 解消確認済み

- **事象**: 旧互換ラッパーで返却していた `recordsReturned` が新 API で欠落。
- **根拠**:
  - `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaAppointmentListResponse.java` に `recordsReturned` が存在しない
  - `server-modernized/src/main/java/open/dolphin/rest/dto/orca/VisitPatientListResponse.java` に `recordsReturned` が存在しない
- **影響**:
  - 監査・テレメトリ（recordsReturned）に基づく UI/ログの整合性が欠ける。
- **本番運用方針（推奨）**:
  - `recordsReturned` は **リスト系 API の共通メタ** として必須化する。
  - クライアントの監査/テレメトリで `recordsReturned` を参照するため、サーバー側で必ず集計する。
- **実装方針**:
  1. `OrcaApiResponse` に `recordsReturned` を追加し、ORCA wrapper 系で共通メタとして扱う。
  2. `/orca/appointments/list` は **`slots.size()`** を `recordsReturned` に設定。
  3. `/orca/visits/list` は **`visits.size()`** を `recordsReturned` に設定。
  4. 監査 details にも `recordsReturned` を追加して従来互換を維持。

**再検証（RUN_ID=20260117T235100Z）**:
- `/orca/appointments/list` / `/orca/visits/list` のレスポンスで `recordsReturned` を確認。証跡: `artifacts/api-architecture-consolidation/20260117T235100Z/appointments-list.json` / `artifacts/api-architecture-consolidation/20260117T235100Z/visits-list.json`
- 監査ログ（JMS → d_audit_event payload）で `recordsReturned` を確認。証跡: `artifacts/api-architecture-consolidation/20260117T235100Z/audit-event-payload.txt` / `artifacts/api-architecture-consolidation/20260117T235100Z/audit-log-snippet.txt`

---

### 3.3 ORCA wrapper の `RUN_ID` が最新証跡と不一致 → 解消確認済み

- **事象**: `OrcaWrapperService.RUN_ID` が `20260114T035009Z` のまま。
- **根拠**:
  - `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java#L46`
  - 証跡では `runId=20260117T220347Z`
- **影響**:
  - UI 側の `runId` が server-fixed 値で上書きされ、最新証跡との整合性が崩れる。
- **本番運用方針（推奨）**:
  - `runId` は **リクエスト単位でクライアント発行値を優先** し、サーバー固定値は使用しない。
  - `X-Run-Id` が無い場合のみサーバー側で UTC 発番する。
- **実装方針**:
  1. `AbstractOrcaWrapperResource` に `resolveRunId` を追加し、`X-Run-Id` → fallback を採用。
  2. `newAuditDetails` は `OrcaWrapperService.RUN_ID` ではなく `resolveRunId` を使う。
  3. `OrcaWrapperService#enrich` は **既に `runId` が入っている場合は上書きしない** 方針に変更する。
  4. 定数 `RUN_ID` は **診断用の既定値** としてのみ残すか、段階的に廃止する。

**再検証（RUN_ID=20260117T235100Z）**:
- `/orca/appointments/list` / `/orca/visits/list` のレスポンスで `runId=20260117T235100Z` を確認。証跡: `artifacts/api-architecture-consolidation/20260117T235100Z/appointments-list.json` / `artifacts/api-architecture-consolidation/20260117T235100Z/visits-list.json`
- 監査ログ（JMS → d_audit_event payload）で `runId=20260117T235100Z` を確認。証跡: `artifacts/api-architecture-consolidation/20260117T235100Z/audit-event-payload.txt` / `artifacts/api-architecture-consolidation/20260117T235100Z/audit-log-snippet.txt`

---

## 4. 残る課題（次アクション）

1. `dataSourceTransition=server` への正規化と ORCA mode の別枠化（実装済み・再検証済み）
2. `recordsReturned` の共通メタ追加と `/orca/appointments/list` / `/orca/visits/list` で集計反映（実装済み・再検証済み）
3. `runId` のヘッダー優先化と固定値上書き防止（`OrcaWrapperService#enrich` の挙動整理）（実装済み・再検証済み）
4. 修正後、`artifacts/api-architecture-consolidation/<RUN_ID>/` で再検証（RUN_ID=20260117T235100Z の証跡を追加済み）

**再検証補足（RUN_ID=20260117T235100Z）**:
- 旧互換ラッパー未呼び出しの再確認ログ: `artifacts/api-architecture-consolidation/20260117T235100Z/legacy-api-check.txt`

---

## 5. 備考

- 本レビューではビルド/起動は再実施していない。証跡は既存 `artifacts/api-architecture-consolidation/20260117T220347Z/` を参照。
