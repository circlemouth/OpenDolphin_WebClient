# PHR Phase-C/D/E 応答サマリ（RUN_ID=20251119TorcaPHRSeqZ1）
- 実施日時 (UTC): 2025-11-14T15:17:42Z
- 接続先: https://weborca.cloud.orcamo.jp（`curl --cert-type P12` `ORCAcertification/103867__JP_u00001294_client3948.p12`）
- Modernized ServerInfo: `serverinfo/claim_conn.json` = `"server"`（HTTP 200, traceId=`serverinfo-20251119TorcaPHRSeqZ1`）

| API | HTTP | メモ | 証跡 |
| --- | --- | --- | --- |
| PHR-06 `/20/adm/phr/identityToken` | 405 Method Not Allowed | レイヤーID Secrets 認証までは成功。ORCA 側 API 未開放につき `Allow: OPTIONS, GET`。`trace/phr-06_identityToken_trace.log` で mTLS → 405 まで確認。 | `httpdump/phr06_identityToken/`, `screenshots/phr-06_identity_response.png` |
| PHR-07 `/20/adm/phr/image/00000001` | 404 Not Found | 画像 API 未提供。レスポンス JSON は `{"Code":404,"Message":"code=404, message=Not Found"}`。 | `httpdump/phr07_image/`, `screenshots/phr-07_image_response.png` |
| PHR-11 `/20/adm/phr/LOCAL.FACILITY.0001,00000001,20250101,20250101` | 404 Not Found | Container ルートが存在せず Signed URL 欄も空。 | `httpdump/phr11_container/`, `screenshots/phr-11_container_response.png` |

## 監査イベント
- `audit/sql/PHR_LAYER_ID_TOKEN.sql`, `PHR_IMAGE_STREAM.sql`, `PHR_CONTAINER_FETCH.sql` で `d_audit_event` を抽出。いずれも 0 rows → Modernized REST での PHR 実装が未着手（ORCA 直叩きのため）。
- Modernized server ログ (`wildfly/phr_20251119TorcaPHRSeqZ1.log`) には `GET /serverinfo/claim/conn` の traceId と Hibernate 認証ログのみを記録。

## TODO
1. Modernized REST (`/openDolphin/resources/20/adm/phr/*`) 実装後に同 RUN_ID で再実測し、200/403 応答＋ `d_audit_event` (`PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_IMAGE_STREAM`, `PHR_CONTAINER_FETCH`) を採取する。
2. `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2 に ORCA 405/404 想定を追記し、Modernized 経由で置換する運用を明示する。
