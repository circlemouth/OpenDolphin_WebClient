# ORCA connectivity baseline (RUN_ID=20251121T153100Z)

- 対象: 開発用 ORCA（詳細は `docs/web-client/operations/mac-dev-login.local.md` を参照、plain HTTP）で DNS/TLS/CRUD を再取得。証跡: `artifacts/orca-connectivity/20251121T153100Z/{dns,tls,crud,trace,blocked}`。Basic ヘッダーは trace/curl ログ内で `Authorization: Basic **masked**` に置換。
- DNS: `nslookup <REDACTED_DEV_ORCA_HOST>` → `40.17.102.100.in-addr.arpa name = clinic-evox2.tail3cf51b.ts.net.`（`dns/nslookup_2025-11-21T06-42-01Z.txt`）。
- TLS: `openssl s_client -connect <REDACTED_DEV_ORCA_HOST>:8000` は `wrong version number`（HTTP 想定、`tls/openssl_s_client_2025-11-21T06-42-36Z.txt`）。TLS 証明書は提供されず。

## CRUD 実行結果（POST）

| API | HTTP | Api_Result | 備考 | Evidence |
| --- | --- | --- | --- | --- |
| `/api01rv2/system01dailyv2` | 200 | 00 | Base_Date=2025-11-21 で正常完了。 | `crud/system01dailyv2/response_2025-11-21T06-43-35Z.xml` |
| `/api01rv2/acceptlstv2?class=01` | 200 | 13 | ドクター未登録。 | `crud/acceptlstv2/response_2025-11-21T06-44-26Z.xml` |
| `/api01rv2/appointlstv2?class=01` | 200 | 12 | ドクター未登録。 | `crud/appointlstv2/response_2025-11-21T06-44-54Z.xml` |
| `/api/api21/medicalmodv2?class=01` | 200 | 10 | 患者 `00000001` が存在しない。 | `crud/medicalmodv2/response_2025-11-21T06-45-19Z.xml` |
| `/orca11/acceptmodv2?class=01` | 405 | - | `Allow: OPTIONS, GET`。POST 未開放。 | `crud/acceptmodv2/response_2025-11-21T06-45-43Z.xml`、`blocked/README.md` |
| `/orca14/appointmodv2?class=01` | 405 | - | `Allow: OPTIONS, GET`。POST 未開放。 | `crud/appointmodv2/response_2025-11-21T06-46-27Z.xml`、`blocked/README.md` |

## メモ / 次アクション

- `acceptlstv2`/`appointlstv2`/`medicalmodv2` はドクター・患者 seed 不足による Api_Result 12/13/10。`0001` ドクターおよび `00000001` 患者データ投入後に再取得すると 00 になる想定。
- `acceptmodv2` と `appointmodv2` は POST が 405。対象ホスト側で POST ルート開放 or 代替エンドポイントの確認が必要。
- Trace は `artifacts/orca-connectivity/20251121T153100Z/trace/` に保存済み（Authorization マスク済み）。
