# ORCA 認証・接続設定と環境切替 棚卸し

- RUN_ID: 20260123T000911Z
- 作業日: 2026-01-23
- YAML ID: src/orca_preprod_implementation_issue_inventory_20260122/03_orca_integration_review/05_認証接続設定と環境切替.md
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769126733227-da2fdb
- 前提ドキュメント: `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`

## 参照した既存資料
- `docs/preprod/implementation-issue-inventory/task-prerequisites-20260122.md`
- `setup-modernized-env.sh`
- `docs/server-modernization/orca-additional-api-implementation-notes.md`
- `docs/web-client/operations/debugging-outpatient-bugs.md`
- `web-client/vite.config.ts`
- `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaTransportSettings.java`
- `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md`（正本）
- `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`（Legacy/参照）

## 確認スコープ
- Basic 認証の設定源・適用経路（server-modernized / Web クライアント dev proxy）
- WebORCA の `/api` プレフィックス挙動と `ORCA_API_PATH_PREFIX` 切替
- `VITE_DEV_PROXY_TARGET` / `VITE_API_BASE_URL` / `VITE_DISABLE_PROXY` 等の環境差
- ORCA 接続先の切替（Trial / Stage / Preprod / On-prem 想定）

## 現状の接続/認証構成（確認済み）
- `setup-modernized-env.sh` は ORCA 接続情報を `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` と `mac-dev-login.local.md` から読み取り、`ORCA_API_*` と `ORCA_BASE_URL` を生成して server-modernized の環境変数へ反映する。
- ORCA 接続先の判定は `ORCA_MODE` を明示しない場合、ホスト名に `weborca` が含まれるかで WebORCA / onprem を判定する。
- server-modernized 側の `OrcaTransportSettings` は WebORCA 判定時に `/api` を自動付与するが、`ORCA_API_PATH_PREFIX` に明示値がある場合は自動付与を停止する。
- Web クライアント dev proxy は `VITE_DEV_PROXY_TARGET` をターゲットとして `/api`（rewrite あり）・`/api01rv2`・`/orca*` を中継する。認証は `ORCA_PROD_BASIC_USER/ORCA_PROD_BASIC_KEY` が設定されている場合のみ Basic ヘッダを付与する。
- Debug 記録では local proxy（`VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources`）で 200 を確認済みだが、Stage/Preview（`100.102.17.40:8000/443/8443`）は TCP timeout が継続している。

## 問題点一覧

> 優先度は P0=緊急, P1=高, P2=中, P3=低

| ID | 区分 | 現状 | 差分/課題 | 運用リスク | 根拠 | 優先度 |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | 接続情報の参照元 | `setup-modernized-env.sh` は非Legacyの `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` を参照するよう更新済み。 | Trial の URL/Basic が暗黙の既定となり、Preprod/本番へ切替時の明示手順が不足。 | 誤った接続先で動作確認/ログ採取してしまい、切替ミスに気付きにくい。 | `setup-modernized-env.sh`, `docs/server-modernization/operations/ORCA_CERTIFICATION_ONLY.md` | P1 |
| AC-02 | WebORCA 判定 | WebORCA 判定はホスト名内の `weborca` 文字列に依存。IP/社内DNS などの場合 `ORCA_MODE=onprem` になり得る。 | WebORCA なのに `/api` 自動付与が無効になり、API が 404/405 になる可能性。 | 環境切替時に `/api` 付与漏れで疎通失敗し、原因特定が遅延する。 | `setup-modernized-env.sh`, `server-modernized/src/main/java/open/dolphin/orca/transport/OrcaTransportSettings.java` | P1 |
| AC-03 | `/api` プレフィックスと dev proxy | Vite の `/api` proxy は rewrite で `/api` を除去するため、`VITE_DEV_PROXY_TARGET` が WebORCA ベース（`https://...`）のみの場合 `/api` が欠落する。 | 直接 WebORCA へ接続する場合、`VITE_DEV_PROXY_TARGET` に `/api` を含める等の条件が明文化されていない。 | 誤った URL で 404 が発生し、Basic 認証/接続先の問題と混同しやすい。 | `web-client/vite.config.ts`, `docs/server-modernization/orca-additional-api-implementation-notes.md` | P1 |
| AC-04 | Basic 認証の分散 | server-modernized は `ORCA_API_USER/PASSWORD`、dev proxy は `ORCA_PROD_BASIC_USER/ORCA_PROD_BASIC_KEY` を参照し、さらに UI 側は `userName/password` ヘッダ（MD5）も併用。 | 認証情報の設定箇所が複数に分散し、環境切替時にどれを更新すべきか不明確。 | 401/404 の原因が認証か経路か判別できず、運用対応が遅れる。 | `setup-modernized-env.sh`, `web-client/vite.config.ts`, `docs/web-client/operations/debugging-outpatient-bugs.md` | P1 |
| AC-05 | ポート制約 | `setup-modernized-env.sh` は `ORCA_API_PORT=8000` を強制的に 18080 へ置換する。 | Stage/Preview で 8000/443/8443 が提示されているが、8000 を設定すると無効化される。 | 誤ったポートで起動し続け、疎通の失敗理由を誤認する。 | `setup-modernized-env.sh`, `docs/web-client/operations/debugging-outpatient-bugs.md` | P2 |
| AC-06 | 証明書/BASIC の切替指針 | dev proxy は証明書 (`ORCA_PROD_CERT_*`) や Basic を受け取れるが、`setup-modernized-env.sh` からの導線/説明がない。 | 本番/認証環境で証明書が必要な場合の設定手順が体系化されていない。 | 認証方式を誤って設定し、接続不可のまま検証が停滞する。 | `web-client/vite.config.ts` | P2 |
| AC-07 | 設定反映の痕跡 | `setup-modernized-env.sh` が `.env.local` を上書きするため、前回の設定が残っていると気付きづらい。 | どの設定で起動したかのログ/証跡の保存先が統一されていない。 | 切替ミスや再現性不足で切り分けが長期化する。 | `setup-modernized-env.sh`, `docs/web-client/operations/debugging-outpatient-bugs.md` | P2 |

## 対応指針（棚卸し結論）
- **環境切替の明文化**: Trial / Stage / Preprod / On-prem の 4 パターンで「必要な env 変数セット」を一覧化し、`setup-modernized-env.sh` の出力ログに採用した値を明示する。
- **WebORCA 判定の明示**: IP/DNS で WebORCA に接続する場合は `ORCA_MODE=weborca` または `ORCA_API_WEBORCA=1` を必須化し、`/api` 付与漏れを回避する。
- **dev proxy 直結時の `/api` ガード**: `VITE_DEV_PROXY_TARGET` を WebORCA に向ける場合は `.../api` を含めることを指針化し、`VITE_API_BASE_URL=/api` の前提を明記する。
- **認証情報の参照元整理**: `ORCA_API_USER/PASSWORD` と `ORCA_PROD_BASIC_USER/KEY` の役割を分離し、どの経路でどの Basic が使われるかを運用手順に追記する。
- **ポート/証明書の制約提示**: 8000 ポート禁止の理由と回避策（例: `ORCA_API_PORT_FALLBACK` の明示）を手順に追記し、証明書必須環境の設定変数を README へ記載する。

## 運用時の主要リスク
- `/api` 付与漏れと Basic 設定不足が同時に起きると、認証/経路/証明書のどこが原因か切り分けられず、疎通再試行が長期化する。
- Legacy の Trial 情報が既定になるため、Preprod/本番への切替時に誤接続したまま検証を進めるリスクが高い。
- Vite dev proxy と server-modernized の認証経路が分離しており、片側だけ設定しても 401/404 が継続する。

## 追加で必要な確認・証跡
- Stage/Preview の接続先（100.102.17.40:8000/443/8443）で `/api` プレフィックスが必要かを判定し、`ORCA_MODE`/`ORCA_API_PATH_PREFIX` の設定例を記録する。
- `ORCA_PROD_CERT_*` / `ORCA_PROD_BASIC_*` の実動作確認（dev proxy 経由）を 1 回実施し、成功時のログ/証跡を `artifacts/orca-connectivity/<RUN_ID>/` へ保存する。
- Web クライアント / server-modernized の各経路で 401/404 が発生した場合の判定フローチャート（どの env を見直すか）を作成する。
