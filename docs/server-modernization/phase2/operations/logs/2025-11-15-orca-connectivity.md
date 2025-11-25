# ORCA 接続検証ログ (RUN_ID=20251115TorcaTrialCrudZ1 / 20251115TorcaTrialAppointZ1 / 20251115TorcaTrialAcceptZ1)

- 予定日: 2025-11-15 10:00 JST（WebORCA トライアルサーバー向け。Windows ホスト + VPN 経由）
- 目的: WebORCA トライアルサーバー（`https://weborca-trial.orca.med.or.jp`）で CRUD 許可前提の Runbook を実走し、Basic 認証 `trial/weborcatrial` と `trial/` 配下の証跡ディレクトリを標準化する。
- 参照ドキュメント: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §1〜§4、`assets/orca-trialsite/raw/trialsite.md`（公式トライアル情報）。
- コメント: CRUD 実施時は `artifacts/orca-connectivity/<RUN_ID>/data-check/<api>.md` へ before/after と操作理由を必ず記録し、ログテンプレ上でもチェックボックス化する。DOC_STATUS 更新はタスク4が担当するため本タスクでは実施しない。

> Runbook 参照: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §0（RUN_ID テンプレ／Evidence 保存／`tmp/orca-weekly-summary.*` 貼り付け）。

## 1. RUN_ID と担当スコープ
| RUN_ID | API / 操作 | 目的・期待応答 | CRUD / ログ要件 | 証跡保存パス |
| --- | --- | --- | --- | --- |
| `20251115TorcaTrialCrudZ1` | `/api/api01rv2/system01dailyv2`（参照） | HTTP 200 / `Api_Result=00`。TLS/BASIC ハンドシェイク確認 | `trial/system01dailyv2.{headers,json}` と `trace/system01dailyv2.trace` を取得。`data-check/system01dailyv2.md` に日時と結果を記録。 | `artifacts/orca-connectivity/20251115TorcaTrialCrudZ1/{dns,tls,trial,trace}` |
| `20251115TorcaTrialAppointZ1` | `/api01rv2/appointlstv2`（参照） + `/orca14/appointmodv2`（CRUD） | 既存予約取得 + 予約登録/更新/削除を 1 ケースずつ実施し `appointlstv2` で確認 | CRUD 実施都度 `data-check/appointmodv2.md` に before/after（予約番号・診療科・日時）を追記。削除時は戻し不要か判定。 | `artifacts/orca-connectivity/20251115TorcaTrialAppointZ1/trial/{appointlstv2,appointmodv2}/` + `screenshots/appoint_{before,after}.png` |
| `20251115TorcaTrialAcceptZ1` | `/api01rv2/acceptlstv2`（参照） + `/orca11/acceptmodv2`（CRUD） | 当日受付参照 + 受付登録/取消の動作確認 | `data-check/acceptmodv2.md` に受付番号・患者 ID・実施理由を記載。受付なしの場合も `acceptlstv2` の `Api_Result=21` を記録。 | `artifacts/orca-connectivity/20251115TorcaTrialAcceptZ1/trial/{acceptlstv2,acceptmodv2}/` |

## 2. DNS / TLS / 環境準備
1. `Resolve-DnsName weborca-trial.orca.med.or.jp`（Windows）または `dig weborca-trial.orca.med.or.jp`（WSL）を実行し、`artifacts/orca-connectivity/20251115TorcaTrialCrudZ1/dns/resolve.log` に保存。
2. `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` を実行し、SNI/TLS 証跡を `tls/openssl_s_client.log` へ保存。
3. `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` の `claim.host=weborca-trial.orca.med.or.jp` / `claim.send.port=443` / `claim.scheme=https` / `claim.conn=server` を再確認し、`ServerInfoResource` の結果を `artifacts/.../serverinfo/claim_conn.json` に格納。
4. プロキシ越しの場合は `HTTPS_PROXY` を設定したうえで `curl --verbose -u trial:weborcatrial --head https://weborca-trial.orca.med.or.jp/` を実行し、Basic 認証が透過していることを `trial/head.log` に保存。

## 3. curl 雛形（Playbook 参照）
- 実行コマンドは `ORCA_CONNECTIVITY_VALIDATION.md` §0.4 の雛形を利用。`RUN_ID=20251115TorcaTrialAppointZ1` で `trial/appointmodv2` `trace/appointmodv2.trace` を作成し、本ログでは Evidence パスのみを管理する。
- 参照 API（`appointlstv2`, `acceptlstv2`）も同 RUN_ID で取得し、`data-check/appointlstv2.md` / `data-check/acceptlstv2.md` に before/after を記載する。
- CRUD 実施時は ORCA UI のスクリーンショットを `screenshots/<api>_<before|after>.png` に保存し、ログテンプレにリンクする。

## 4. 実施メモ（完了後チェック）
- [ ] `20251115TorcaTrialCrudZ1`：DNS/TLS/ServerInfoResource、`system01dailyv2`、`data-check/system01dailyv2.md`
- [ ] `20251115TorcaTrialAppointZ1`：`appointlstv2` 参照結果、`appointmodv2` CRUD、`data-check/appointmodv2.md`
- [ ] `20251115TorcaTrialAcceptZ1`：`acceptlstv2` 参照結果、`acceptmodv2` CRUD、`data-check/acceptmodv2.md`
- [ ] CRUD 実施ログを `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3 の表へ反映（Allow: trial/ディレクトリ記法確認）
- [ ] `artifacts/orca-connectivity/README.md` を更新し、各 RUN_ID の証跡パス・スクリーンショットの場所・未対応リスクを追記

## 5. 週次棚卸し連携
- `npm run orca-weekly` 実行後に生成される `tmp/orca-weekly-summary.{json,md}` は `ORCA_CONNECTIVITY_VALIDATION.md` §0.3 の指示通り、`docs/web-client/planning/phase2/DOC_STATUS.md`／`docs/web-client/README.md`／`docs/server-modernization/phase2/PHASE2_PROGRESS.md` へ貼り付ける。貼り付け箇所を更新したら本ログのチェックリストにも反映する。
- Evidence 用に `RUN_ID=20251115TrialWeeklyZ1` を採番し、`artifacts/orca-connectivity/validation/20251115TrialWeeklyZ1/weekly_summary.log` を作成して CLI 出力と Markdown/JSON 両方を保存する。
