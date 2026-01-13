# 01 API共通ユーティリティ設計

- RUN_ID: `20260113T073916Z`
- 期間: 2026-01-13 17:00 〜 2026-01-14 17:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/web_client_orca_additional_api_plan/01_API共通ユーティリティ設計.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client-orca-additional-api-plan.md`
- `docs/server-modernization/orca-additional-api-implementation-notes.md`
- `web-client/src/libs/xml/xmlUtils.ts`
- `web-client/src/libs/http/httpClient.ts`
- `web-client/src/libs/observability/observability.ts`
- `web-client/src/libs/audit/auditLogger.ts`

---

## 1. 目的と前提
- XML2/JSON の共通パースと、監査・観測メタの扱いを **単一方針に統一**する。
- Webクライアントは **server-modernized 経由**で ORCA API を呼び出す。
- `httpFetch` → `observability` → `auditLogger` の導線を維持し、ORCA 追加 API で再利用できる共通ユーティリティを定義する。

---

## 2. 現状整理（課題）
- XML2 は `xmlUtils.ts` により `Api_Result`/`Api_Result_Message` 抽出が可能だが、**JSON の共通ユーティリティが未整備**。
- JSON 応答（帳票/pusheventgetv2 等）は画面側で個別にパースしており、**runId/traceId/Api_Result の扱いが不統一**。
- `Data_Id` → `/blobapi/{Data_Id}` の取得は server-modernized に実装済だが、クライアント側の共通利用導線がない。

---

## 3. Api_Result / Api_Result_Message 抽出方針（明文化）

### 3-1. 共通の判定ルール
- `Api_Result` は **0 のみで構成される場合に成功**とみなす（例: `00`, `000`, `0000`）。
- `Api_Result_Message` は **文字列としてそのまま表示**し、UI では `Api_Result` と併記する。
- `httpFetch` で HTTP 4xx/5xx の場合は、`Api_Result` が存在しても `ok=false` と扱う。

### 3-2. XML2 の抽出
- `web-client/src/libs/xml/xmlUtils.ts` を使用し、以下を統一抽出する。
  - `Api_Result`
  - `Api_Result_Message`
  - `Information_Date`
  - `Information_Time`
- 必須タグは `Api_Result` を最小要件とし、`checkRequiredTags` で `missingTags` を返す。

### 3-3. JSON の抽出
- 新規ユーティリティ `web-client/src/libs/orca/orcaJsonUtils.ts` を追加する。
- JSON では **トップレベルの `Api_Result`/`Api_Result_Message` を優先**し、存在しない場合は以下の順に探索する。
  1. `result.Api_Result` / `result.Api_Result_Message`
  2. `response.Api_Result` / `response.Api_Result_Message`
  3. `data.Api_Result` / `data.Api_Result_Message`
- `Data_Id` は同様の探索ルールで抽出する（トップレベル優先）。

---

## 4. 共通ユーティリティ設計（提案）

### 4-1. 共通メタ型
```ts
export type OrcaApiMeta = {
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  dataId?: string;
  missingKeys?: string[]; // JSON での必須キー不足
};

export type OrcaApiResponse<T> = {
  ok: boolean;
  status: number;
  runId?: string;
  traceId?: string;
  meta: OrcaApiMeta;
  data?: T;
  raw?: unknown; // JSON/XML の生データ保持
  error?: string;
};
```

### 4-2. JSON ユーティリティ（新規）
```ts
// web-client/src/libs/orca/orcaJsonUtils.ts
export const extractOrcaJsonMeta = (payload: unknown): OrcaApiMeta => {
  // Api_Result / Api_Result_Message / Data_Id / Information_* を共通抽出
};

export const resolveOrcaApiOk = (apiResult?: string) => {
  return Boolean(apiResult && /^0+$/.test(apiResult));
};

export const normalizeOrcaJsonResponse = <T>(
  payload: unknown,
  response: Response,
  requiredKeys: string[] = ['Api_Result'],
): OrcaApiResponse<T> => {
  // meta 抽出 + requiredKeys 不足確認 + runId/traceId 統合
};
```
- JSON では `requiredKeys` を API ごとに指定できるようにし、**欠損時は `missingKeys` に記録**する。
- `runId`/`traceId` は `response.headers` と `observability` を併用し、`httpFetch` の `captureObservabilityFromResponse` に準拠。

### 4-3. XML2 ユーティリティ（既存の活用整理）
- `xmlUtils.ts` は **現行 API 実装で既に利用されているため継続利用**する。
- 呼び出し側で `OrcaApiResponse` へマッピングし、XML/JSON を同一の型に合わせる。

---

## 5. Data_Id / blobapi 取得の共通化案

### 5-1. 共通関数（提案）
```ts
// web-client/src/libs/orca/orcaReportUtils.ts
export async function fetchOrcaReportPdf(params: {
  dataId: string;
  signal?: AbortSignal;
}): Promise<{ blob: Blob; contentType?: string }> {
  // /blobapi/{Data_Id} を httpFetch で取得し Blob として返す
}
```

### 5-2. 統一フロー
1. JSON 応答から `Data_Id` を抽出（`extractOrcaJsonMeta`）。
2. `Data_Id` がある場合に `fetchOrcaReportPdf` を呼び、`Blob` を返却。
3. UI は `URL.createObjectURL(blob)` でプレビュー／ダウンロードを行う。

### 5-3. 失敗時の扱い
- `Data_Id` が欠損の場合は `Api_Result` を参照し、警告バナーへ反映する。
- `blobapi` 失敗時は `ok=false` とし、`auditLogger` へ `operation=blob_fetch` を記録する。

---

## 6. runId/traceId 付与・監査ログ項目

### 6-1. runId/traceId の付与ルール
- `httpFetch` が `X-Run-Id` / `X-Trace-Id` を自動付与する。
- **API 呼び出し前に `ensureObservabilityMeta()` を呼び、欠損時は生成**する。
- 応答ヘッダの `x-run-id` / `x-trace-id` を `captureObservabilityFromResponse` で反映する。

### 6-2. auditLogger への標準項目
`auditLogger.logAuditEvent` で payload に以下を追加し、ORCA API を横断的に追跡できるようにする。

| 項目 | 内容 |
| --- | --- |
| action | `ORCA_API_REQUEST` / `ORCA_REPORT_PRINT` / `ORCA_PUSH_FETCH` など |
| operation | `request` / `response` / `blob_fetch` / `parse_error` |
| endpoint | `/api01rv2/prescriptionv2` など |
| httpStatus | `response.status` |
| apiResult | `Api_Result` |
| apiResultMessage | `Api_Result_Message` |
| dataId | `Data_Id` |
| patientId | 患者 ID（あれば） |
| requestNumber / class | ORCA のパラメータ |
| missingTags / missingKeys | 必須タグ欠損 |
| runId / traceId | `observability` と同じ値 |

- 監査 payload の `details` に `responseHeaders` と `observabilityMeta` を添付しておくと、トラブル時の相関が容易になる。

---

## 7. httpFetch / observability / auditLogger の拡張方針

### 7-1. `httpFetch` 拡張案
- `HttpFetchInit` に `observability?: ObservabilityMeta` を追加し、**API 呼び出し単位で runId/traceId を上書き可能**にする。
- 既存呼び出しは影響なし（未指定時は現在の meta を使用）。

### 7-2. `observability` 拡張案
- `ensureObservabilityMeta()` は ORCA API 呼び出し直前に利用し、**UI イベントと API 実行の runId を一致**させる。
- `resolveRunId()` を UI バッジに利用し、API 実行結果の runId を即表示できるようにする。

### 7-3. `auditLogger` 拡張案
- `action` に ORCA 系の分類を追加し、**操作カテゴリを統一**する。
- `payload.details` は共通ユーティリティ側で整形し、API モジュールは **最小限の入力**にする。

---

## 8. 実装時の標準フロー（概略）

### 8-1. XML2
1. `ensureObservabilityMeta()` で runId/traceId を確定
2. `httpFetch` で XML リクエスト送信
3. `parseXmlDocument` → `extractOrcaXmlMeta`
4. `OrcaApiResponse` に正規化
5. `auditLogger` へ結果を記録

### 8-2. JSON + blobapi
1. `ensureObservabilityMeta()` で runId/traceId を確定
2. `httpFetch` で JSON リクエスト送信
3. `extractOrcaJsonMeta` で `Api_Result`/`Data_Id` 抽出
4. `Data_Id` があれば `fetchOrcaReportPdf` で PDF 取得
5. `auditLogger` へ `request`/`response`/`blob_fetch` を記録

---

## 9. 受け入れ条件との対応
- Api_Result / Api_Result_Message の抽出方針: **セクション 3 に明文化**。
- Data_Id / blobapi 取得共通化: **セクション 5 で整理**。
- runId/traceId の付与・監査ログ項目: **セクション 6 に定義**。

---

## 次のアクション
1. `orcaJsonUtils.ts` と `orcaReportUtils.ts` の実装方針を確定し、API モジュールへ組み込み。
2. XML2/JSON 既存 API を `OrcaApiResponse` 形式へ順次統一。
3. UI の RunId/監査バナーに JSON API の結果を反映（Charts/Reception/Administration）。
