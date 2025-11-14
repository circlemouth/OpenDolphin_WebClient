# ORCA 接続検証ログ (予定 RUN_ID=20251115TorcaAppointLstZ1 / 20251115TorcaAppointMod405Z1 / 20251115TorcaMedical405Z1 / 20251115TorcaAcceptMod405Z1)

- 予定日: 2025-11-15 10:00 JST（オンライン回線確保済みの Windows ホストで実施）
- 目的: 2025-11-13 実測で 404/405 となった P0 API（予約一覧/予約登録/診療登録/受付登録）の RUN_ID を再取得し、`artifacts/orca-connectivity/<RUN_ID>/httpdump/` に 200/404/405 証跡を整備する。
- 事前方針: WebORCA 本番の既存データを参照できれば正常稼働とみなし、欠落データが見つかった場合は seed を投入せず Ops へ報告する。
- 参照ドキュメント: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md#43-p0-api-セット`、`ORCA_HTTP_404405_HANDBOOK.md`

## 1. 予定 RUN_ID と担当
| RUN_ID | API | 目的/期待応答 | データ確認 / 事前準備 | 証跡保存パス |
| --- | --- | --- | --- | --- |
| `20251115TorcaAppointLstZ1` | `/api01rv2/appointlstv2` | HTTP 200 / `Api_Result=00`（予約一覧） | ORCA UI で Department=01 / Physician=00001 の最新予約を確認し、スクリーンショットと `SELECT` ログを `data-check/appointlstv2.*` に保存。欠落時は RUN を延期し Ops へ報告。 | `artifacts/orca-connectivity/20251115TorcaAppointLstZ1/httpdump/appointlstv2/` + `trace/appointlstv2_trace.log` |
| `20251115TorcaAppointMod405Z1` | `/orca14/appointmodv2` | POST 405 + `Allow: OPTIONS, GET` | リクエストボディで使用する患者/医師/保険コードが ORCA DB に存在するか `SELECT`。存在しない場合でも seed は追加せず、「欠落」レポートを `data-check/appointmodv2.sql` として残す。 | `artifacts/orca-connectivity/20251115TorcaAppointMod405Z1/httpdump/orca14_appointmodv2/` |
| `20251115TorcaMedical405Z1` | `/api21/medicalmodv2`（直打ち 405） / `/api/api21/medicalmodv2`（200 / `Api_Result=14`） | 診療登録ルート閉鎖証跡と API プレフィックス結果を同 RUN_ID で保存 | `tbl_sryact` 等から直近の診療行為が存在するか読み取り SQL を実行し、`data-check/medicalmodv2.sql` へ保存。欠落時は seed 投入せず Ops へ報告。 | `artifacts/orca-connectivity/20251115TorcaMedical405Z1/httpdump/{api21_medicalmodv2,api_api21_medicalmodv2}/` |
| `20251115TorcaAcceptMod405Z1` | `/orca11/acceptmodv2` | POST 405 + `Allow: OPTIONS, GET` | `tbl_uketuke` と `acceptlstv2` のレスポンスで患者 00000001 の受付が存在するか確認し、`data-check/acceptmodv2.sql` へ記録。存在しなければ seed 追加は行わず報告。 | `artifacts/orca-connectivity/20251115TorcaAcceptMod405Z1/httpdump/orca11_acceptmodv2/` |

## 2. DNS / TLS 事前チェック
1. Windows 側 `C:\Users\Hayato\.wslconfig` に `generateResolvConf=false` が設定されていることを確認し、WSL 再起動後も `/etc/resolv.conf` が手動管理状態を維持しているか点検する。
2. `Resolve-DnsName weborca.cloud.orcamo.jp` → `35.76.144.148 / 54.178.230.126` を取得して `artifacts/orca-connectivity/<RUN_ID>/dns/resolve_dnsname_<UTC>.log` に保存。
3. `openssl s_client -connect weborca.cloud.orcamo.jp:443 -servername weborca.cloud.orcamo.jp` を実行し、CN=`*.cloud.orcamo.jp` / TLSv1.2 を `tls/openssl_s_client_<UTC>.log` へ格納。
4. `ORCA_PROD_CERT` パスフレーズが `curl --cert-type P12` で通ることを `system01dailyv2` の HEAD リクエスト（`curl --head ...`）で確認し、`curl: (58)` 発生時はログを `httpdump/system01dailyv2/` へ保存してから再開。

## 3. `curl` 雛形
```bash
export ORCA_PROD_CERT="ORCAcertification/103867__JP_u00001294_client3948.p12"
export ORCA_PROD_CERT_PASS=$(cat ORCAcertification/新規\ テキスト\ ドキュメント.txt | grep CERT_PASS | cut -d'=' -f2)
export ORCA_PROD_BASIC_USER=$(cat ORCAcertification/新規\ テキスト\ ドキュメント.txt | grep BASIC_USER | cut -d'=' -f2)
export ORCA_PROD_BASIC_KEY=$(cat ORCAcertification/新規\ テキスト\ ドキュメント.txt | grep BASIC_KEY | cut -d'=' -f2)
RUN_ID=20251115TorcaAppointLstZ1
mkdir -p artifacts/orca-connectivity/${RUN_ID}/{httpdump,trace,dns,tls}
curl --silent --show-error --cert-type P12 \
     --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
     -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
     -H 'Content-Type: application/json; charset=Shift_JIS' \
     -X POST --data-binary '@/tmp/request.json' \
     'https://weborca.cloud.orcamo.jp/api/api01rv2/appointlstv2?class=01' \
     -D artifacts/orca-connectivity/${RUN_ID}/httpdump/appointlstv2/response.headers \
     -o artifacts/orca-connectivity/${RUN_ID}/httpdump/appointlstv2/response.json \
     --trace-ascii artifacts/orca-connectivity/${RUN_ID}/trace/appointlstv2_trace.log
```

## 4. 実施メモ（実行後に追記）
- [ ] `RUN_ID=20251115TorcaAppointLstZ1` HTTP/`Api_Result`、予約件数
- [ ] `RUN_ID=20251115TorcaAppointMod405Z1` 405 `Allow` ヘッダー
- [ ] `RUN_ID=20251115TorcaMedical405Z1` 405/200 両経路
- [ ] `RUN_ID=20251115TorcaAcceptMod405Z1` 405 `Allow` / trace
