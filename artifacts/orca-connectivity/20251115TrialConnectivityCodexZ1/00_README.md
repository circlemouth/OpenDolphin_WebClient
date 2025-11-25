# RUN_ID=20251115TrialConnectivityCodexZ1 Evidence Summary

- 実施日時: 2025-11-15 22:45-23:10 JST（CLI / Codex sandbox）。
- 参照順: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md`。
- 接続先: `https://weborca-trial.orca.med.or.jp/`（Basic 認証 `trial/weborcatrial`）。GUI 端末は利用不可のため UI スクリーンショットは未取得。

## 完了した項目
| 項目 | 証跡 | 備考 |
| --- | --- | --- |
| DNS 解析 (`nslookup`) | `dns/nslookup_2025-11-15T13-48-30Z.txt` | CNAME=`weborca-trial1.japaneast.cloudapp.azure.com` → `172.192.77.103` を確認。 |
| TLS ハンドシェイク | `tls/openssl_s_client_2025-11-15T13-48-52Z.txt` | `*.orca.med.or.jp`（Sectigo）証明書 / TLSv1.2 / ECDHE-RSA-AES256-GCM-SHA384。 |
| seed/患者確認 | `data-check/patientgetv2_{*,00001}_2025-11-15T13-47-*.xml`、`data-check/README.md` | 患者番号は 5 桁 `00001` が有効。`00000001` は `Api_Result=10`。GUI 未確認。 |
| CRUD 実測 | `crud/*/` | `acceptlstv2`/`appointlstv2`: HTTP 200, `Api_Result=12/13`（ドクター未登録）。`acceptmodv2`/`appointmodv2`: HTTP 405（Allow=GET）。`medicalmodv2`: HTTP 200, `Api_Result=14`（ドクター未登録）。 |
| Coverage/Blocker 追加 | `coverage/coverage_matrix.md`, `blocked/README.md` | firecrawl 仕様 79 本を Trial 提供/非提供に分類。HTTP 405 と trialsite#limit の根拠を明記。 |

## 残課題
1. GUI 端末で 01 医事業務を開き、`Physician_Code=0001` のマスター存在を確認する（CLI では doctor seed 不足の切り分け不可）。
2. `acceptmodv2` / `appointmodv2` の HTTP 405 が trialsite 制限由来か、別ポート/API で解決可能かを確認。trialsite#limit §1-§4 を引用済みだが、UI 側のメニュー制限を画面で採取する。
3. `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3 に doctor seed 不足時の fallback（UI で seed 補完 or Blocker 登録）を追記する。今回の差分メモを Runbook へ連携済み。

## ディレクトリガイド
| パス | 説明 |
| --- | --- |
| `dns/` | `nslookup` のフルログ（UTC タイムスタンプ入り）。 |
| `tls/` | `openssl s_client -servername weborca-trial...` 出力。証明書鎖と TLSv1.2 cipher を記録。 |
| `data-check/` | 患者 seed の API レスポンスと CLI しか使えない旨のメモ。 |
| `crud/acceptlstv2` | `request_2025-11-15T13-49-41Z.xml`（payload コピー）、`response...xml`（Api_Result=13）、`headers...txt`。 |
| `crud/appointlstv2` | 同上（Api_Result=12）。 |
| `crud/acceptmodv2`, `crud/appointmodv2` | `headers...txt` に HTTP 405 / Allow=OPTIONS,GET を保存。 |
| `crud/medicalmodv2` | `response_2025-11-15T13-49-41Z.xml`（患者未存在）、`response_2025-11-15T13-52-14Z.xml`（doctor 未存在）を並べ、患者 ID 差し替え結果を比較。 |
| `blocked/README.md` | Trial 非提供 API とデータギャップの一次整理。 |
| `coverage/coverage_matrix.md` | firecrawl 仕様一覧に Trial Availability を付与した表。 |

## RUN_ID 命名チェック
- `node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` → 既存 Evidence（この RUN_ID を含む）に Trial 固有ラベルが付与されているため NG。推奨名は UTC タイムスタンプ（例: `20251115T135446Z`）だった。
- Phase2 では `RUN_ID=YYYYMMDDT<用途>Z#` で統一する必要があり、命名チェックスクリプトへ Trial 用ラベルを許容する PR を追加で検討する。
