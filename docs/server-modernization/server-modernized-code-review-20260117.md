# server-modernized コードレビュー（API統合計画対応）

**レビュー日**: 2026-01-17  
**RUN_ID**: 20260117T224649Z  
**追記日**: 2026-01-17  
**追記RUN_ID**: 20260117T230508Z  
**追記日(2)**: 2026-01-18  
**追記RUN_ID(2)**: 20260118T003027Z  
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

---

## 6. 追加レビュー（本番運用観点・臨時実装/保守性/性能）

**レビュー日**: 2026-01-18  
**RUN_ID**: 20260118T003027Z  
**対象範囲**: `server-modernized/src/main/java` / `server-modernized/src/main/webapp/WEB-INF/web.xml`  

### 6.1 重大（Critical）

1. **ヘッダーベース認証がデフォルト有効 + 固定SYSAD資格情報のバイパス**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java#L35-L52`
     - `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java#L230-L251`
   - **懸念**:
     - `userName/password` ヘッダーでの認証が標準で許可され、固定の SYSAD 資格情報 + パス末尾一致でのバイパスが存在。
     - 本番で露出した場合、権限逸脱・不正アクセスの重大リスク。
   - **改修候補**:
     - 本番ではヘッダ認証を強制無効化（Elytron/HTTP標準認証へ移行）。
     - 固定SYSAD資格情報とパス一致のバイパスは撤去。

2. **施設IDのヘッダ合成による principal 生成**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java#L316-L337`
   - **懸念**:
     - `X-Facility-Id` をヘッダで送信すれば、`facilityId:user` の principal を合成できるため、施設なりすましの可能性。
   - **改修候補**:
     - 施設IDの信頼源を認証済み principal のみに限定。
     - ヘッダ由来の施設IDは監査用メタ情報としてのみ扱う。

3. **Touch系エンドポイントのヘッダ認証依存**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/touch/TouchAuthHandler.java#L25-L55`
   - **懸念**:
     - Touch 系は `userName/password` ヘッダーを前提とした設計が残存。
     - Auth基盤統一が未完で、運用時のセキュリティモデルが不一致。
   - **改修候補**:
     - HTTP標準認証またはトークン方式へ統一。
     - 旧ヘッダ認証は段階的に廃止。

### 6.2 高（High）

1. **Demo API の本番登録とハードコード資格情報**
   - **根拠**:
     - `server-modernized/src/main/webapp/WEB-INF/web.xml#L49-L70`
     - `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java#L85-L103`
   - **懸念**:
     - `/demo` API が本番でも利用可能になりうる。
     - テスト用 ID/パスワードがコードに残存。
   - **改修候補**:
     - 本番向けビルド/起動で `/demo` を除外（リソース登録を環境条件で分岐）。
     - テスト用資格情報の外部化/削除。

2. **`RUN_ID` が固定値のままの API が残存**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/orca/AbstractOrcaRestResource.java#L20`
     - `server-modernized/src/main/java/open/dolphin/rest/OrcaApiProxySupport.java#L13-L24`
   - **懸念**:
     - リクエスト単位の追跡ができず、監査・障害対応に支障。
   - **改修候補**:
     - `X-Run-Id` ヘッダー優先 + サーバ側 UTC 発番に統一。
     - 固定 RUN_ID の段階的廃止。

3. **Trial 未検証 / stub 固定の ORCA 機能が本番 API として露出**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalAdministrationResource.java#L21-L80`
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPatientResource.java#L103-L108`
     - `server-modernized/src/main/java/open/dolphin/rest/PatientModV2OutpatientResource.java#L135-L140`
   - **懸念**:
     - 本番要件に対し未実装機能が「正常API」として公開される可能性。
   - **改修候補**:
     - 本番で必要な API は実装・実機検証。
     - 代替としては明示的に「未提供/非公開」にする。

### 6.3 中（Medium）

1. **Subjectives のデフォルトが stub 応答**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaPostFeatureFlags.java#L25-L52`
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaSubjectiveResource.java#L71-L78`
   - **懸念**:
     - 明示設定がなければ本番でも stub 応答になる。
   - **改修候補**:
     - 本番の既定値を REAL に変更 or 設定必須化。

2. **`SimpleDateFormat` の static 共有**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java#L37`
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaDiseaseResource.java#L44`
   - **懸念**:
     - スレッド非安全であり高負荷時に日付破損/例外の可能性。
   - **改修候補**:
     - `DateTimeFormatter` への置換。

3. **Karte 未生成時の NPE 可能性**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java#L101-L103`
   - **懸念**:
     - `karteServiceBean.getKarte` が null の場合に 500 になる可能性。
   - **改修候補**:
     - null チェック + 404/適切な Api_Result を返却。

4. **予約一覧のレンジが無制限で ORCA 逐次アクセス**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/orca/service/OrcaWrapperService.java#L102-L124`
   - **懸念**:
     - 広い日付範囲での呼び出しが性能劣化につながる。
   - **改修候補**:
     - 最大レンジの制限、ページング or バッチ間引き。

5. **ORCA transport 設定のリクエスト毎ロード**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/orca/transport/RestOrcaTransport.java#L47`
   - **懸念**:
     - I/O コスト増加と設定揺れ（運用中の設定変更の反映タイミング不明）。
   - **改修候補**:
     - 起動時キャッシュ + 手動リロード機構。

6. **ORCA 応答メッセージのログ出力**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaHttpClient.java#L160-L175`
     - `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaHttpClient.java#L340-L346`
   - **懸念**:
     - 数字以外の PHI がログに残る可能性。
   - **改修候補**:
     - メッセージの出力を抑制またはマスク強化。

### 6.4 低（Low）

1. **ヘッダ資格情報キャッシュに TTL がない**
   - **根拠**:
     - `server-modernized/src/main/java/open/dolphin/mbean/UserCache.java#L18-L49`
   - **懸念**:
     - パスワードローテーション後も古いキャッシュが残留する可能性。
   - **改修候補**:
     - TTL/手動クリア手段を追加。

### 6.5 次アクション候補（整理用）

1. 認証方式の統一（ヘッダ認証撤去 / 標準HTTP認証）
2. Demo/Stub 系 API の本番向け公開可否を決定
3. `RUN_ID` のリクエスト単位発番へ統一
4. スレッド非安全な日付処理の刷新
