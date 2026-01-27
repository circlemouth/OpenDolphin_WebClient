# 03 MSW差分吸収

- RUN_ID: 20260127T084233Z
- 作業日: 2026-01-27
- 期間: 2026-01-31 09:00 - 2026-02-01 09:00
- 優先度: medium
- 緊急度: medium
- YAML ID: src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/03_MSW差分吸収.md
- 対象IC: IC-64
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769503205302-55cfd8
- 前提ドキュメント:
  - docs/preprod/implementation-issue-inventory/issue-catalog-resolution-prerequisites-20260123.md
  - docs/web-client/architecture/web-client-api-mapping.md
  - src/validation/E2E_統合テスト実施.md
  - src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/01_再現用seedデータ整備.md
  - src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/02_ORCAデータ準備手順.md

## 目的
- MSW シナリオと実データの差分を「検証で使える形」で明示化する。
- 実データ特有の揺れ（Api_Result 非00、空文字応答）で UI/テストが誤って成功し続ける状態を防ぐ。

## 差分一覧（検証用差分表）
| 対象API | 実データの挙動（証跡） | 既存MSWの挙動 | 差分/リスク | 吸収方針 | 今回の対応 |
| --- | --- | --- | --- | --- | --- |
| `/orca/appointments/list` | データ無しでも HTTP 200 + `apiResult=21`（対象予約なし）。`slots=[]`。`artifacts/60117/20260119T053758Z/appointments-normal.txt` | `apiResult` を返さず、空配列でも正常系と見分けづらい | 実環境では Api_Result を見て分岐するが、MSW では検出できない | 空配列時の Api_Result を MSW で再現可能にする | `real-empty` シナリオで `apiResult=21` を返すよう更新 |
| `/orca/visits/list` | データ無しでも HTTP 200 + `apiResult=13`（対象なし）。`visits=[]`。`artifacts/60117/20260119T053758Z/visits-normal.txt` | `apiResult` を返さず、空配列でも正常系と見分けづらい | Reception の「空だが Api_Result 付き」ケースが未検証 | 空配列時の Api_Result を MSW で再現可能にする | `real-empty` シナリオで `apiResult=13` を返すよう更新 |
| `/orca/appointments/list` / `/orca/visits/list` | 条件不足で `apiResult=91`（処理区分未設定）になることがある。`artifacts/60117/appointments-list.txt` / `artifacts/orca-preprod/20260126T140855Z/responses/visit_list_20260126.json` | Api_Result を注入する手段が限定的 | 実環境で 91 が返るのに MSW では再現が難しい | fault/scenario で Api_Result を固定できるようにする | `x-msw-fault: api-91` を追加 |
| `/orca/visits/mutation` | 入力不足やマスタ不足で `apiResult=02/03/14/52` が返り、応答の `acceptanceId` や `patient` が空文字になる。例: `artifacts/orca-preprod/20260126T140855Z/responses/visit_mutation_min_00001.json` / `visit_mutation_dept_00001.json` / `visit_mutation_doctor4_00001.json` / `visit_mutation_doctor5_00001.json` | `apiResult=00/21/E99` 中心で、空文字応答や 02/03/14/52 を再現しづらい | 実環境で起きるエラー/空文字応答の検証漏れ | fault で Api_Result を直接注入できるようにする | `x-msw-fault: api-02/api-03/api-13/api-14/api-52/api-91` を追加 |
| `/orca/visits/mutation` | `apiResult=00` でも `acceptanceId=""`、`patient.patientId=""` など空文字応答がある。`artifacts/orca-preprod/20260126T140855Z/responses/visit_mutation_doctor6_00001.json` / `artifacts/orca-preprod/20260126T214708Z/responses/visit_mutation_00005.json` | 成功時は acceptanceId と patient を常に返す | 実環境では UI が更新されない/壊れるが MSW では成功し続ける | MSW で空文字応答を再現し、UI 側で吸収する | `x-msw-fault: real-no-echo` を追加し、UI 側で空文字を正規化 |
| `/orca/appointments/list` / `/orca/visits/list` | 日付レンジ過大で HTTP 400 + validationError。`artifacts/60117/20260119T053758Z/appointments-range-too-wide.txt` / `artifacts/60117/20260119T053758Z/visits-range-too-wide.txt` | HTTP 400 を前提にしたケースの再現が薄い | 実環境の 400 系バリデーションが E2E で漏れる | fault で 400/5xx を注入できるよう維持/拡張 | 既存 fault（http-401/403/404/500/timeout）に加え Api_Result 系を補強 |
| `/orca/visits/mutation` | 認証条件により HTTP 401（header_auth_disabled / unauthorized）。`artifacts/orca-preprod/20260126T140855Z/responses/visit_mutation_retry_00001.json` | 401 の実挙動に対するシナリオ意識が弱い | MSW では成功しがちで、認証差分の検証が漏れる | fault で HTTP 401 を注入し、画面の復旧導線を検証 | 既存の `http-401` 注入を活用（本タスクでは差分表に明記） |

## シナリオ更新（MSW）
### 1. 外来系 fixture の Api_Result 付与
- 対象: `web-client/src/mocks/fixtures/outpatient.ts`
- 変更点:
  - `OutpatientFlagSet` に `apiResult` / `apiResultMessage` を追加。
  - `real-empty` シナリオを追加（recordsReturned=0）。
  - `recordsReturned=0` のとき:
    - appointments: `apiResult=21`
    - visits: `apiResult=13`
  - claim は `recordsReturned=0` を明示できるようにし、Api_Result を返すよう整理。

### 2. 受付 mutation の実データ差分注入
- 対象: `web-client/src/mocks/handlers/orcaReception.ts`
- 変更点:
  - `x-msw-fault` / `x-msw-scenario` で以下を注入可能にした。
    - `api-02`: 診療科未設定
    - `api-03`: ドクター未設定
    - `api-13`: 対象なし
    - `api-14`: ドクター不存在
    - `api-52`: 受付登録エラー
    - `api-91`: 処理区分未設定
    - `real-no-echo`: 成功でも acceptanceId/patient が空文字

### 3. UI 側の差分吸収（空文字応答の正規化）
- 対象: `web-client/src/features/reception/api.ts`
- 変更点:
  - 空文字を `undefined` として扱う正規化を追加。
  - 応答が患者情報を返さない場合でも、`params.patientId` を保持するよう補強。
- テスト:
  - `web-client/src/features/reception/__tests__/acceptmodv2.test.ts` に「空文字応答でも patientId を維持」ケースを追加。

## 使い方（差分再現の手引き）
- appointments/visits の空結果 + Api_Result を再現:
  - ヘッダ: `x-msw-scenario: real-empty`
- visits/mutation の Api_Result を固定:
  - ヘッダ例: `x-msw-fault: api-14`
- visits/mutation の「成功だが応答が空」を再現:
  - ヘッダ: `x-msw-fault: real-no-echo`

## 実施した検証
- 依存導入:
  - `web-client` 配下で `npm ci --cache .npm-cache`
- vitest:
  - `npm run test -- src/features/reception/__tests__/acceptmodv2.test.ts`
  - `npm run test -- src/features/reception/__tests__/exceptionLogic.test.ts src/features/charts/__tests__/chartsMasterSourceCache.test.tsx`

## 完了条件チェック
- MSW と実環境の不一致が差分表として明示されている。
- 差分を再現できる MSW シナリオ/ fault が追加されている。
- 実データ特有の空文字応答に対して UI 側の吸収が入っている。

## 更新ファイル
- src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/03_MSW差分吸収.md
- web-client/src/mocks/fixtures/outpatient.ts
- web-client/src/mocks/handlers/orcaReception.ts
- web-client/src/features/reception/api.ts
- web-client/src/features/reception/__tests__/acceptmodv2.test.ts
