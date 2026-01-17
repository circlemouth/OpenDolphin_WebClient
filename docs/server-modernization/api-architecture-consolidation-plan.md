# Webクライアント/サーバー API統合計画（現行・一括移行）

**初版作成日**: 2026-01-15  
**初版RUN_ID**: 20260115T195100Z  
**現行更新日**: 2026-01-17  
**現行RUN_ID**: 20260117T194110Z  
**対象**: Webクライアント (`web-client`) / モダナイズ版サーバー (`server-modernized`)  
**位置づけ**: 現行ドキュメント。旧 `docs/server-modernization/phase2/notes/api-architecture-consolidation-plan.md` は廃止。

## 1. 前提

* 本システムは **稼働前** であり、段階的移行・並走は不要。
* **一挙移行（同一リリースでのクライアント・サーバー同時切替）** を前提にする。
* 後方互換は不要だが、移行失敗時のリカバリ手順は明記する。

---

## 2. 現状整理（真贋確認済み）

現在は以下の複数系統が混在している。

| 区分 | 代表パス | 利用状況 | 取扱い |
| :--- | :--- | :--- | :--- |
| **DolphinネイティブAPI** | `/orca/disease` `/orca/order/bundles` `/orca/master/*` `/orca/patient/mutation` `/orca/medical/records` | Webクライアントが利用中 | 維持 |
| **ORCA公式APIパススルー** | `/api01rv2/*` `/orca12/*` `/orca21/*` `/orca22/*` `/orca25/*` `/api/orcaXX/*` `/api/api01rv2/*` | Webクライアントが利用中 | 維持 |
| **Webクライアント互換ラッパー（独自）** | `/api01rv2/appointment/outpatient/*` `/api01rv2/claim/outpatient/*` `/api01rv2/patient/outpatient/*` | Webクライアントが利用中 | **廃止対象** |
| **OpenDolphin独自ユーティリティ** | `/api/orca/queue` | Webクライアントが利用中 | 維持 |

---

## 3. 一括移行の方針（簡素化版）

1. **互換ラッパーを全廃** し、API系統を「Dolphinネイティブ + ORCA公式パススルー + 独自ユーティリティ」に整理する。
2. Webクライアントは **新APIのみ** を呼ぶ前提に一括修正し、旧APIは同リリース内で削除する。
3. 監査・可観測性メタ（`runId/traceId/requestId/dataSource/...`）は移行先APIで完全に引き継ぐ。

---

## 4. 一括移行手順（詳細計画）

### 4.1 移行対象の確定（即日）
* 互換ラッパー3本を移行対象として確定：
  * `/api01rv2/appointment/outpatient/*`
  * `/api01rv2/claim/outpatient/*`
  * `/api01rv2/patient/outpatient/*`
* ORCA公式パススルーと誤認しないよう、削除禁止ラインを明文化する。

### 4.2 サーバー側の修正（同一ブランチ内で完結）
**目的**: 旧互換ラッパーの機能を新APIへ移植し、旧APIを削除できる状態にする。

1. **予約系**
   * 既存の `/orca/appointments/list`・`/orca/appointments/mutation` を正とする。
   * 互換ラッパーで保持している監査メタ・レスポンス形式を新APIに統合。
2. **受付/来院系**
   * `/orca/visits/list`・`/orca/visits/mutation` を正とする。
   * 旧 `/api01rv2/visitptlstv2` は ORCA公式パススルーとして存続（互換ラッパーではない）。
3. **請求系（要実装）**
   * 互換ラッパー `/api01rv2/claim/outpatient/*` のロジックを **新規 `/orca/claim/outpatient/*`** に移植する。
   * `ClaimOutpatientResponse` のメタ項目（`runId`/`dataSource`/`claimBundles` 等）は維持。
4. **患者検索（ローカル）**
   * `/api01rv2/patient/outpatient` のローカル検索は **新規 `/orca/patients/local-search`** に移植する。
   * ORCA検索（`/orca/patients/name-search`）は別機能扱いで維持。
5. **監査・観測メタ統一**
   * 旧APIで出していた `runId/dataSource/cacheHit/missingMaster/fallbackUsed/recordsReturned` を新APIでも返す。
   * `AuditEventEnvelope` の `action/operation` を旧APIと同じ語彙に揃える。

### 4.3 クライアント側の修正（同一リリースで一括）
**目的**: Webクライアントから旧API呼び出しを完全排除する。

1. `web-client/src/libs/http/httpClient.ts` の `OUTPATIENT_API_ENDPOINTS` を新APIに置換。
2. 各機能の API モジュールを新パスへ差し替え：
   * 予約系 → `/orca/appointments/*`
   * 受付/来院系 → `/orca/visits/*`
   * 請求系 → `/orca/claim/outpatient/*`
   * ローカル患者検索 → `/orca/patients/local-search`
3. MSW/Playwright のモックを新パスへ切替（`web-client/src/mocks/*`）。
4. Debug/Administration の表示文言に旧API名が残っていないか確認。

### 4.4 旧API削除（同一リリース内）
* サーバーから以下の互換ラッパー実装を削除：
  * `AppointmentOutpatientResource`
  * `OutpatientClaimResource`
  * `PatientOutpatientResource`
* 関連DTO・テスト・ドキュメント内の参照を削除。

### 4.5 検証（移行完了条件）
* **起動確認**: `setup-modernized-env.sh` で起動し、Reception/Patients/Charts/Administration の主要導線が 2xx。
* **監査ログ**: 新API経由でも `runId/traceId/requestId` が出力されること。
* **旧API未呼び出し**: ログ/ネットワークトレースで `/api01rv2/appointment|claim|patient/outpatient` が出ていないこと。

### 4.6 リカバリ手順（稼働前でも必須）
* 旧API削除前のコミットをタグ化し、切替失敗時は即時戻せる状態にする。
* 旧APIの削除は「クライアント差し替えが完了した後」に行う（同一リリース内でも順序遵守）。

---

## 5. API対照表（移行後の正本）

| 機能 | 旧API（廃止） | 新API（正） | 備考 |
| :--- | :--- | :--- | :--- |
| 予約一覧 | `/api01rv2/appointment/outpatient/list` | `/orca/appointments/list` | 既存実装あり |
| 予約登録 | `/api01rv2/appointment/outpatient` | `/orca/appointments/mutation` | 既存実装あり |
| 受付一覧 | `/api01rv2/visitptlstv2` | `/orca/visits/list` | ORCA公式は存続、Webクライアントは `/orca/visits/list` を使用 |
| 請求バンドル | `/api01rv2/claim/outpatient/*` | `/orca/claim/outpatient/*` | **新規実装** |
| 患者検索（ローカル） | `/api01rv2/patient/outpatient` | `/orca/patients/local-search` | **新規実装** |
| 患者検索（ORCA） | - | `/orca/patients/name-search` | 既存実装あり |
| 患者更新 | `/orca12/patientmodv2/outpatient` | 同左 | ORCA公式パススルー維持 |
| 医療記録取得 | `/orca21/medicalmodv2/outpatient` | 同左 | ORCA公式パススルー維持 |
| 病名編集 | `/orca/disease` | 同左 | Dolphinネイティブ維持 |
| オーダー束編集 | `/orca/order/bundles` | 同左 | Dolphinネイティブ維持 |
| ORCA帳票 | `/api01rv2/prescriptionv2` 等 | 同左 | ORCA公式パススルー維持 |
| ORCA配信キュー | `/api/orca/queue` | 同左 | 独自ユーティリティ維持 |

---

## 6. 患者検索の扱い（明確化）

* **ローカル検索**: `/orca/patients/local-search` で `PatientServiceBean` を検索し、現行の挙動を維持する。
* **ORCA検索**: `/orca/patients/name-search` は ORCA 同期用途と位置付ける。
* **混在禁止**: 1画面内でローカル検索とORCA検索を混在させない（UX混乱とデータ差分の原因）。
