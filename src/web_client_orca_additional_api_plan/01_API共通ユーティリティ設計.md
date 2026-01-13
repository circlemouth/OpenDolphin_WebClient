# 01 API共通ユーティリティ設計

- RUN_ID: `20260113T074815Z`
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
- `httpFetch` で HTTP 4xx/5xx の場合は、`Api_Result` が存在しても **`ok=false` を優先**する。

### 3-1-1. 成功判定・優先順位（HTTP と Api_Result の関係）
```
優先順位: HTTPステータス > パース可否 > Api_Result

1) HTTP 4xx/5xx → ok=false（Api_Result が 0 系でも error 扱い）
2) HTTP 2xx/3xx かつ パース失敗 → ok=false + parse_error を監査
3) HTTP 2xx/3xx かつ Api_Result=0系 → ok=true
4) HTTP 2xx/3xx かつ Api_Result≠0系 → ok=false（業務エラー）
```

### 3-1-2. UI 表示ルール（最小ガイド）
- **HTTP 失敗**: 画面は「通信失敗」として表示。`Api_Result` が 0 系でも「成功」とは表示しない。
- **HTTP 成功 + Api_Result 非0**: 業務エラーとして `Api_Result`/`Api_Result_Message` を表示。
- **HTTP 成功 + Api_Result 0 系**: 成功バナー/ラベルを表示し、必要に応じて `Api_Result_Message` を補足。
- **パース失敗**: `Api_Result` 未取得として「レスポンス解析失敗」を表示。監査は `parse_error`。

### 3-2. XML2 の抽出
- `web-client/src/libs/xml/xmlUtils.ts` を使用し、以下を統一抽出する。
  - `Api_Result`
  - `Api_Result_Message`
  - `Information_Date`
  - `Information_Time`
- 必須タグは `Api_Result` を最小要件とし、`checkRequiredTags` で `missingTags` を返す。
 - `Api_Result_Message` が未取得でも UI は `Api_Result` を最優先で表示する。

### 3-2-1. XML の警告/情報タグと Data_Id 抽出
- **警告/情報系タグ**（存在する場合は監査に記録し UI へ伝搬）:
  - `Api_Warning_Message` / `Api_Information` / `Api_Information_Message`（ORCA 仕様差異があるため未取得時は無視）
- **Data_Id の再帰抽出**:
  - `Data_Id` がトップレベルで見つからない場合、XML 全体から `Data_Id` タグを走査して最初の値を採用する。
  - 複数 `Data_Id` が存在する場合は配列としてログに残し、**採用値は先頭**とする。
  - いずれも未取得の場合は `missingTags` に `Data_Id` を追加し、監査に `missingTags` を記録する。

### 3-3. JSON の抽出
- 新規ユーティリティ `web-client/src/libs/orca/orcaJsonUtils.ts` を追加する。
- JSON では **トップレベルの `Api_Result`/`Api_Result_Message` を優先**し、存在しない場合は以下の順に探索する。
  1. `result.Api_Result` / `result.Api_Result_Message`
  2. `response.Api_Result` / `response.Api_Result_Message`
  3. `data.Api_Result` / `data.Api_Result_Message`
- `Data_Id` は同様の探索ルールで抽出する（トップレベル優先）。

### 3-3-1. JSON 抽出ルール詳細
- **配列の扱い**:
  - `Api_Result` が配列内に複数存在する場合、**最初に成功判定可能な要素**を採用する。
  - 成功判定可能な要素がない場合は、**先頭要素**の値を採用する。
- **多段ネスト**:
  - 探索は深さ優先で `Api_Result`/`Api_Result_Message`/`Data_Id` を探索する。
  - 探索の上限は **深さ 6 / ノード 500** とし、過剰なネストは `parse_warning` として監査に記録する。
- **複数 Api_Result が見つかった場合の選択基準**:
  1. トップレベルに最も近い値
  2. 成功判定可能な値（0 系）
  3. それでも複数ある場合は **最初の出現順**
- **Data_Id の優先度**:
  - `Data_Id` は `Api_Result` と同じ階層が存在すればそれを優先し、なければ最初に見つかった値を採用する。

### 3-3-2. JSON 抽出の監査ルール
- 複数候補がある場合は `details.apiResultCandidates`/`details.dataIdCandidates` を監査 payload に残す。
- `Api_Result` 未取得時は `missingKeys` に `Api_Result` を追加し、`ok=false` + `parse_error` で記録する。

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
 - `Data_Id` が複数取得された場合は **先頭で処理**し、残りは `auditLogger` の `details.dataIdCandidates` に保存する。

---

## 6. runId/traceId 付与・監査ログ項目

### 6-1. runId/traceId の付与ルール
- `httpFetch` が `X-Run-Id` / `X-Trace-Id` を自動付与する。
- **API 呼び出し前に `ensureObservabilityMeta()` を呼び、欠損時は生成**する。
- 応答ヘッダの `x-run-id` / `x-trace-id` を `captureObservabilityFromResponse` で反映する。

### 6-2. auditLogger への標準項目
`auditLogger.logAuditEvent` で payload に以下を追加し、ORCA API を横断的に追跡できるようにする。

| 項目 | 内容 | 必須 |
| --- | --- | --- |
| action | `ORCA_API_REQUEST` / `ORCA_REPORT_PRINT` / `ORCA_PUSH_FETCH` など | 必須 |
| operation | `request` / `response` / `blob_fetch` / `parse_error` | 必須 |
| endpoint | `/api01rv2/prescriptionv2` など | 必須 |
| httpStatus | `response.status` | 必須 |
| apiResult | `Api_Result` | 任意 |
| apiResultMessage | `Api_Result_Message` | 任意 |
| dataId | `Data_Id` | 任意 |
| patientId | 患者 ID（あれば） | 任意 |
| requestNumber / class | ORCA のパラメータ | 任意 |
| missingTags / missingKeys | 必須タグ欠損 | 任意 |
| runId / traceId | `observability` と同じ値 | 必須 |

### 6-3. PII/機微情報の取り扱い指針
- **保存禁止（監査に残さない）**:
  - 氏名、住所、電話番号、保険者番号、被保険者証記号番号、患者メモ本文、SOAP 本文、薬剤名の全文など
- **許容（運用上必要な最小限）**:
  - patientId（内部 ID）、appointmentId、claimId、runId/traceId、Api_Result、Data_Id
- **マスキング方針**:
  - `payload.details` で原文を持つ場合は `maskSensitiveLog` により短縮・伏字化する。
  - XML/JSON の生データは **監査へ保存しない**（必要なら `raw` はメモリ保持のみ）。

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
