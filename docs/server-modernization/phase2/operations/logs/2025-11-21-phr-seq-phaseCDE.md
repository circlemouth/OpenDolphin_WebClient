# 2025-11-21 PHR Phase-C/D/E Trial 実測ログ（RUN_ID=20251121TrialPHRSeqZ1-CDE）
- 対応タスク: 【ワーカー指示】Task-F「PHR Phase-C/D/E Trial 実測」
- 実施者: Codex（macOS 15.1 CLI）。Basic 認証 `trial/weborcatrial` のみを使用し、PKCS#12 は禁止ポリシーに従い未使用。
- 参照資料: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md`（Phase-C/D/E）、`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2、`docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#limit`。

## 1. 実施サマリ
| 項目 | 内容 |
| --- | --- |
| RUN_ID | `20251121TrialPHRSeqZ1-CDE` |
| 対象 API | Phase-C: PHR-06 `POST /20/adm/phr/identityToken`<br/>Phase-D: PHR-07 `GET /20/adm/phr/image/{patientId}`<br/>Phase-E: PHR-11 `GET /20/adm/phr/{facility,patient,docSince,labSince}` |
| 実行日時 | 2025-11-16 07:59 JST （UTC 2025-11-15T22:59:04Z） |
| 実行方法 | `curl -u trial:weborcatrial` に `X-Facility-Id=1234567`, `X-Touch-TraceId=20251121TrialPHRSeqZ1-CDE`, `X-Access-Reason=<api>` を付与。PHR-06 は `Content-Type: application/json` + `X-Consent-Token`、PHR-07 は `Accept: image/jpeg`、PHR-11 は `Accept: application/json` を指定。`httpdump/` へレスポンスを保存し、`trace/` へ `--trace-ascii` を記録。
| 結果 | 3 API すべてが `weborca-trial.orca.med.or.jp` 側で 405/404 応答。`trialsite` の「お使いいただけない機能」セクションに記載された管理系制限により `/20/adm/phr/*` 系は Trial 公開範囲外であることを再確認した。
| ServerInfoResource | モダナイズ環境は未使用（今回の測定対象外）。必要に応じて `serverinfo/claim_conn` の再取得タスクを別 RUN_ID で指示する。 |

## 2. API 別結果
| API | 期待値（Runbook） | 実測 | 証跡パス |
| --- | --- | --- | --- |
| PHR-06 `POST /20/adm/phr/identityToken` | Layer ID トークン発行 (`PHR_LAYER_ID_TOKEN_ISSUE` 監査)。 | HTTP 405 Method Not Allowed（Allow: OPTIONS, GET）。`{"Code":405,"Message":"code=405, message=Method Not Allowed"}`。Trial サイト記載の管理業務制限に該当。 | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CDE/httpdump/phr06_identityToken/`, `trace/phr06_identityToken_trace.log`, `crud/phr_phase_cde/phr06_identityToken/result.md` |
| PHR-07 `GET /20/adm/phr/image/{patientId}` | Schema 画像ストリーム (`PHR_SCHEMA_IMAGE_STREAM`) を取得し帯域ログ化。 | HTTP 404 Not Found。`{"Code":404,"Message":"code=404, message=Not Found"}`。Trial サイトでは画像/外部出力業務が提供対象外。 | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CDE/httpdump/phr07_image/`, `trace/phr07_image_trace.log`, `crud/phr_phase_cde/phr07_image/result.md` |
| PHR-11 `GET /20/adm/phr/{facility,patient,docSince,labSince}` | PHRContainer JSON + `PHR_SIGNED_URL_*` 監査。 | HTTP 404 Not Found。`{"Code":404,"Message":"code=404, message=Not Found"}`。Trial サイトのデータ出力制限に該当。 | `artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CDE/httpdump/phr11_container/`, `trace/phr11_container_trace.log`, `crud/phr_phase_cde/phr11_container/result.md` |

## 3. ブロッカー整理
1. **Trial 公開範囲**: `trialsite.md#limit` にて「プログラム更新」「外部媒体業務」「照会業務でのCSV作成」などが禁止と明記されているため、PHR 管理 API（Layer ID/画像/Container）は 405/404 で遮断される。→ Blocker ラベル `TrialLocalOnly` を継続。
2. **Modernized 実装切替**: 本番で求められる `PHR_LAYER_ID_TOKEN_ISSUE`・`PHR_SCHEMA_IMAGE_STREAM`・`PHR_CONTAINER_FETCH/PHR_SIGNED_URL_*` 監査は RESTEasy 実装側で証跡化する必要がある。Trial 環境で 200 応答を得ることはできないため、Modernized サーバー上で e2e を実施する計画を Phase-C/D/E 表へ反映。

## 4. Evidence
- `artifacts/orca-connectivity/20251121TrialPHRSeqZ1-CDE/`
  - `crud/phr_phase_cde/phr0{6,7,11}_*/`（リクエスト定義・結果メモ）
  - `httpdump/phr0{6,7,11}_*/request.http|response.headers|response.body|status.*`
  - `trace/phr0{6,7,11}_trace.log`
- 参考: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#limit`（Trial 制限引用）

## 5. 次アクション
- Modernized PHR 実装の Unit/E2E で `PHR_SIGNED_URL_*` と監査ログ採取を進行（Task-G 後続）。
- Trial 環境では今回の 405/404 証跡を基に DOC_STATUS W22 行へ Blocker を追記し、ORCA 週次レビューで共有する。
