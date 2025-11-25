# 2025-11-19 PHR Phase-C/D/E 実測ログ（RUN_ID=20251119TorcaPHRSeqZ1）
- 対応タスク: 【ワーカー指示】Task-F「PHR Phase-C/D/E 実測証跡取得（Layer ID / 画像 / Container）」
- 実施者: Codex（WSL 環境）。RUN_ID=20251119TorcaPHRSeqZ1 をテンプレートから展開し、PHR-06 → PHR-07 → PHR-11 の順に `curl --cert-type P12` を実行。
- 参照資料: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2、`docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md`、`artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md`。

## 1. 実施サマリ
| 項目 | 内容 |
| --- | --- |
| RUN_ID | `20251119TorcaPHRSeqZ1` |
| 対象 API | Phase-C: PHR-06 `POST /identityToken`, Phase-D: PHR-07 `GET /image/{patientId}`, Phase-E: PHR-11 `GET /{facility,patient,docSince,labSince}` |
| 実行日時 | 2025-11-15 00:17 JST（UTC `2025-11-14T15:17:42Z`） |
| 実行方法 | `scripts/orca_prepare_next_run.sh` → テンプレ再展開 → `ORCAcertification/103867__JP_u00001294_client3948.p12` を `curl --cert-type P12` に指定し、PHR-06 → 07 → 11 を順次実行。`httpdump/`, `trace/`, `screenshots/`, `logs/` をテンプレに沿って更新。 |
| 結果 | PKCS#12 passphrase を `FJjmq/d7EP` へ更新したことで TLS ハンドシェイク/Basic 認証までは成功。ORCA 側 `/20/adm/phr/*` が未開放のため PHR-06=405、PHR-07=404、PHR-11=404。HTTP 証跡・trace ログ・スクリーンショットを取得。 |
| ServerInfoResource | Modernized Compose（`docker-compose.modernized.dev.yml`）を起動し、`curl -H userName/password/... http://localhost:9080/openDolphin/resources/serverinfo/claim/conn` で HTTP 200 (`body=server`) を取得。`serverinfo/claim_conn.{headers,json,status}` へ保存。 |
| WildFly / Screenshots | `wildfly/phr_20251119TorcaPHRSeqZ1.log` に `/serverinfo/claim/conn` の traceId と Hibernate クエリを記録。PHR API は ORCA 直叩きのためアプリログ無し。スクリーンショットは `scripts/render_png_text.js` で HTTP ステータスを埋め込み PNG 化し `screenshots/phr-0X_*_response.png`へ格納。 |

## 2. API 別結果
| API | 期待値（Runbook） | 実測 | 証跡パス |
| --- | --- | --- | --- |
| PHR-06 `POST /20/adm/phr/identityToken` | Layer ID Secrets 注入 + `PHR_LAYER_ID_TOKEN_ISSUE` 監査。`wildfly/identityToken.log` へ結果記録。 | HTTP 405 (Method Not Allowed, `Allow: OPTIONS, GET`)。mTLS 相互認証は成功し `trace/phr-06_identityToken_trace.log` に TLS/HTTP ハンドシェイクが記録された。 | `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/phr06_identityToken/`, `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/trace/phr-06_identityToken_trace.log`, `phr-seq/30_layer-id/identityToken/` |
| PHR-07 `GET /20/adm/phr/image/{patientId}` | 画像ストリーム (`Cache-Control: no-store`), 帯域ログ, `PHR_SCHEMA_IMAGE_STREAM` 監査。 | HTTP 404 (Not Found)。Schema 画像 API が ORCA 本番に存在せず JSON 404 を返却。 | `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/phr07_image/`, `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/trace/phr-07_image_trace.log`, `phr-seq/40_image/image/` |
| PHR-11 `GET /20/adm/phr/{facility,patient,docSince,labSince}` | Container JSON + Signed URL (`PHR_SIGNED_URL_ISSUED`) 取得。 | HTTP 404 (Not Found)。`SignedUrlService` 未実装のため JSON 404 のみ。 | `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/phr11_container/`, `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/trace/phr-11_container_trace.log`, `phr-seq/50_container/container/` |

## 3. ServerInfo / WildFly / Screenshots
- ServerInfo: `serverinfo/claim_conn.json` に `\"server\"`、`claim_conn.headers` に HTTP 200 + `X-Trace-Id: serverinfo-20251119TorcaPHRSeqZ1` を保存。`status` ファイルで取得時間を記録。
- WildFly: `wildfly/phr_20251119TorcaPHRSeqZ1.log` に `/serverinfo/claim/conn` 呼び出し時の Hibernate クエリと traceId を記録。PHR API は ORCA 直叩きのため監査ログは発生せず。
- Screenshots: `scripts/render_png_text.js` で HTTP ステータス＋RUN_ID を描画した PNG (`screenshots/phr-06_identity_response.png` など) へ更新し、レビュー時に即参照できるよう差し替え。

## 4. Pending / 対応方針
1. **Modernized REST 実装**: ORCA 本番には `/20/adm/phr/*` が存在しないため 405/404 が上限。Modernized server (`/openDolphin/resources/20/adm/phr/*`) で同 API を実装し、再実測では HTTP 200/403＋`d_audit_event` (`PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_IMAGE_STREAM`, `PHR_CONTAINER_FETCH`) を取得する。
2. **監査ログ**: `audit/sql/PHR_*.sql` で `d_audit_event` を抽出したが 0 rows。Modernized 側の REST イベントで traceId=`20251119TorcaPHRSeqZ1` を書き込むよう `PhrAuditHelper` 実装を確認し、再測時に SQL を差し替え。
3. **Runbook 更新**: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2 と ORCA 週次ログに「PKCS#12 OK / HTTP 405/404 まで取得済。Modernized への置換が必要」旨を反映する。

## 5. Evidence
- ディレクトリ: `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/`
  - `httpdump/phr06_identityToken/`, `phr07_image/`, `phr11_container/`
  - `trace/phr-06_identityToken_trace.log`, `trace/phr-07_image_trace.log`, `trace/phr-11_container_trace.log`
  - `serverinfo/claim_conn.{headers,json,status}`, `wildfly/phr_20251119TorcaPHRSeqZ1.log`, `screenshots/phr-0X_*_response.png`
  - `logs/phr_container_summary.md`, `audit/sql/PHR_LAYER_ID_TOKEN.sql`, `PHR_IMAGE_STREAM.sql`, `PHR_CONTAINER_FETCH.sql`
- 参照ログ: `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#73-task-f-phr-phase-cde-実測証跡取得run_id20251119torcaphrseqz1-締切-2025-11-19-1000-jst`, `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md#8-run_id20251119torcaphrseqz1-実測メモ2025-11-14-実施`
