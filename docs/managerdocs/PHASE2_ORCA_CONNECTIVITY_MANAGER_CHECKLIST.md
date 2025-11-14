# Phase2 ORCA Connectivity Run マネージャーチェックリスト（2025-11-19）

## 1. 背景
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3（P0 API セット）と §4.3.1（curl 雛形・evidence 初期化）が 2025-11-19 時点の「既存データ参照」方針へ更新済。RUN_ID は `20251115TorcaAppointLstZ1 / ...AppointMod405Z1 / ...Medical405Z1 / ...AcceptMod405Z1` を使用。
- `docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` 10-43 に RUN_ID・証跡パス・`assets/orca-api-requests/*.json` テンプレが同期済。
- ログ雛形: `docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md`（目的/スケジュール/RUN_ID表/DNS・TLSチェック雛形付き）。
- 棚卸し: `docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84 に Runbook §4.3 改訂＆ログテンプレ追加メモ済。タスク完了時は同行「モダナイズ/外部連携（ORCA）」を更新する。
- 運用ポリシー: WebORCA 本番に存在するデータを API/UI/`psql`（読み取り）で確認できれば RUN 前提を満たすとみなし、欠落時は seed 投入を行わず Ops/マネージャーへ報告する。`docs/server-modernization/phase2/operations/assets/seeds/*.sql` はアーカイブ扱い。
- 追加 RUN_ID: `20251119TorcaPHRSeqZ1`（PHR-06/07/11, Phase-C/D/E）は PKCS#12 パスを更新済みで再測を完了（HTTP 405/404 まで到達）。証跡は `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/`、ログは `docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md`・`2025-11-13-orca-connectivity.md` §7.3・`2025-11-18-phr-layerid-ready.md` に追記済。`serverinfo/claim_conn.json` / `wildfly/phr_20251119TorcaPHRSeqZ1.log` も採取済で、残タスクは Modernized REST での 200/403＋監査取得。

## 2. タスクボード（チェックボックス運用）
- [ ] **タスクA: 既存データ確認・証跡化** — 担当A
  - [ ] `psql`（読み取り）と ORCA UI を使い、患者 00000001 / 医師 00001 / 保険 06123456 / 直近日受付・予約 / 診療行為が存在するかを確認し、結果を `artifacts/orca-connectivity/<RUN_ID>/data-check/` に保存（SQL ログ・スクリーンショットなど）。
  - [ ] データが欠落していた場合は seed 投入を行わず、欠落テーブル・確認時間・端末を `docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` とマネージャーチャンネルへ報告。
  - [ ] 【ワーカー報告】では確認対象、ログパス、欠落有無、フォローアップを記載。
  - **進捗メモ（2025-11-14 RUN_ID=`20251114TorcaSeedPrepZ1`）:** PKCS#12 パス `FJjmq/d7EP` と BASIC 認証情報を更新し、`system01dailyv2` 疎通を実施（`artifacts/orca-connectivity/20251114TorcaSeedPrepZ1/weborca-prod/`）。`nc -vz weborca.cloud.orcamo.jp 5432` はタイムアウト → seed 投入は停止し既存データ確認フローへ切替済。Ops とは bastion/TLS 情報共有を継続中（`artifacts/orca-connectivity/seed/psql_port_check.log`）。
- [ ] **タスクB: ORCA UI/画面証跡確認** — 担当B（A 完了後に着手）
  - [ ] ORCA 本番 UI で Department=01 / Physician=00001 の直近予約・受付一覧を表示し、画面キャプチャを `artifacts/orca-connectivity/20251115TorcaAppointLstZ1/ui/` に保存。
  - [ ] 予約/受付が欠落している場合は seed 追加を試みず、欠落種類と再現手順をマネージャーへ報告。必要に応じて `data-check/` ログへリンク。
  - [ ] 【ワーカー報告】では確認日時、取得画面、欠落有無、フォローアップを記載。
- [ ] **タスクC: curl 実行 & 証跡採取（4 RUN_ID）** — 担当C（B 完了後）
  - [ ] DNS/TLS 事前チェック (`nslookup`, `openssl s_client`) を各 RUN_ID 直前に実施し、結果を `dns/`, `tls/` ディレクトリへ保存。端末要件: `generateResolvConf=false` 済み WSL or VPN 許可 Linux。
  - [ ] `20251115TorcaAppointLstZ1`: `/api01rv2/appointlstv2` で HTTP 200 / `Api_Result=00` を取得し、事前に確認した予約情報との整合をメモ。
  - [ ] `20251115TorcaAppointMod405Z1`: `/orca14/appointmodv2` 405 + `Allow` ヘッダー確保。リクエスト ID が `data-check/` 結果と一致するか確認。
  - [ ] `20251115TorcaMedical405Z1`: `/orca21/...` 405 + `/api/api21/medicalmodv2` 200 (`Api_Result=14` 想定)。参照診療行為の確認ログと紐付け。
  - [ ] `20251115TorcaAcceptMod405Z1`: `/api01rv2/acceptlstv2` 200 or 21。受付データが欠落していた場合は RUN を延期した旨をログへ記載。
  - [ ] 各 curl 後に `docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` RUN_ID 表へ結果反映し、証跡パスと課題を報告。
- [ ] **タスクD: 証跡整理・ドキュメント反映** — 担当D（A-C の成果を集約）
  - [ ] `2025-11-15-orca-connectivity.md` を埋め、目的/スケジュール/事前チェック/各 RUN_ID 成果を記録。必要に応じスクリーンショットや `trace/*.log` へのリンクを追加。
  - [ ] `ORCA_CONNECTIVITY_VALIDATION.md` §4.3 「想定課題」欄へ今回の実績メモ（DNS/TLS/LST など）を追記。
  - [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84 を「モダナイズ/外部連携（ORCA）」完了状況で更新。
  - [ ] `artifacts/orca-connectivity/20251115Torca*/README.md`（インデックス）を作成し、`httpdump/trace/dns/tls/ui` への導線を一覧化。
  - [ ] 更新ファイルと未完了点を 【ワーカー報告】 で共有。
- [ ] **タスクE: PHR Phase-C/D/E 接続再測（RUN_ID=20251119TorcaPHRSeqZ1）** — 担当E（Task-D 成果を参照し PHR 連携側の Blocker 解消）。進行率 70%（PKCS#12 再測＆HTTP 405/404 取得済、Modernized REST 実装待ち）。
  - [x] `scripts/orca_prepare_next_run.sh` でテンプレ展開し、`artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/{README.md,httpdump,trace,serverinfo,wildfly,screenshots}` を初期化。
- [x] `docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md` を新規作成し、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` §7.3 / `2025-11-18-phr-layerid-ready.md` Pending 表を更新。`PHASE2_PROGRESS.md` と `DOC_STATUS.md` W22 行へ RUN_ID と失敗理由を追記。
  - Blocker: ORCA 本番に `/20/adm/phr/*` が存在しないため、再測後も PHR-06=HTTP 405 / PHR-07=HTTP 404 / PHR-11=HTTP 404 が上限。`serverinfo/claim_conn.json` と `wildfly/phr_20251119TorcaPHRSeqZ1.log` は取得済で、スクリーンショットも `phr-0{6,7,11}_response.png` へ更新完了。次アクションは Modernized REST 実装で 200/403＋`d_audit_event` を取得すること。
  - [x] Ops (#ops-secrets) から正しい PKCS#12 パスフレーズ（`FJjmq/d7EP`）を受領し、RUN_ID=`20251119TorcaPHRSeqZ1` で Phase-C/D/E を再測（mTLS/Basic 成功 → ORCA 側未実装により HTTP 405/404 まで取得）。Phase-A/B (`RUN_ID=20251115TorcaPHRSeqZ1`) と合わせて PKCS 起因の Blocker は解消。
  - [x] Modernized server（`docker-compose.modernized.dev.yml`）を起動し、`serverinfo/claim_conn.json`（HTTP 200, body=`server`）と `wildfly/phr_20251119TorcaPHRSeqZ1.log` を採取、`Could not resolve host` エラーを解消。
  - [x] `httpdump/`, `trace/`, `screenshots/`, `logs/phr_container_summary.md`, `audit/sql/PHR_*.sql` を実測内容へ更新（PHR-06=405, PHR-07=404, PHR-11=404）。Runbook §4.3.2 / ORCA 週次ログ / DOC_STATUS / PHASE2_PROGRESS を再同期し、次ステップを「Modernized REST で 200/403＋監査取得」へ移行。

## 3. 進捗確認ポイント
- [ ] **Check A**: 既存データ確認結果（SQL/スクリーンショット）と欠落報告有無。
- [ ] **Check B**: ORCA UI 画面証跡（予約/受付一覧）が取得できているか。
- [ ] **Check C1-C4**: 各 RUN_ID の DNS/TLS 記録、curl 成否、`Allow` ヘッダー取得有無。
- [ ] **Check D**: Runbook/log/DOC_STATUS/Artifacts の同期状況。全完了後、本チェックリスト冒頭に完了日を追記。
- [ ] **Check PHR**: RUN_ID=`20251119TorcaPHRSeqZ1` / `20251115TorcaPHRSeqZ1` の Modernized REST 実装ロードマップ（200/403＋`d_audit_event` 取得、Signed URL/S3 経路の e2e 検証、ORCA 週次共有）を追跡。
- 進捗が滞った場合は代替端末や追加ワーカーを再割当てし、該当タスクのチェックボックス横に注記を残すこと。

## 4. ワーカー指示・報告テンプレ
- 指示接頭辞 `【ワーカー指示】` はタスクA〜E へ割当済（本ドキュメント §2 を参照）。
- 報告時は以下テンプレを厳守：
  1. RUN_ID（複数可 / ドキュメント作業のみは `RUN_ID=NA`）。
  2. 実施内容（データ確認/ curl コマンド / 編集ファイル）。
  3. 使用端末と DNS/TLS チェック結果。
  4. 証跡ディレクトリ（`artifacts/...` `logs/...` `ui/...` など）とスクリーンショット有無。
  5. 課題・対処・フォローアップ（再採番が必要な場合は案含む）。
  6. `DOC_STATUS.md` 更新有無と該当行。

### 【ワーカー報告】Task-E（2025-11-15 00:30 JST / 担当: Codex）
- RUN_ID: `20251119TorcaPHRSeqZ1`（Phase-C/D/E 再測）
- 実施内容: RUN テンプレ再展開 → `curl --cert-type P12`（証明書 `103867__JP_u00001294_client3948.p12`, pass=`FJjmq/d7EP`）で PHR-06/07/11 を順次実行。HTTP 405/404 応答を `httpdump/phr0{6,7,11}_*/` と `trace/phr-0{6,7,11}_*.log` へ保存し、`logs/phr_container_summary.md`・`audit/sql/PHR_*.sql`・`screenshots/phr-0X_*_response.png` を更新。`scripts/render_png_text.js` を追加してステータス入り PNG を生成。
- 使用端末 / DNS: WSL2（generateResolvConf=false）。`trace/phr-06_identityToken_trace.log` で `weborca.cloud.orcamo.jp` への TLS1.2 ハンドシェイク成功を確認。
- 証跡パス: `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/`（httpdump/trace/serverinfo/wildfly/screenshots/audit/logs）。
- 課題・フォローアップ: ORCA 本番 `/20/adm/phr/*` が未開放のため HTTP 405/404 が上限。Modernized REST 実装で 200/403 + `PHR_LAYER_ID_TOKEN_ISSUE` / `PHR_IMAGE_STREAM` / `PHR_CONTAINER_FETCH` を取得する必要あり。Signed URL/S3 e2e（Phase-F）タスクへ引継ぎ。
- DOC_STATUS / 週次更新: `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行と `PHASE2_PROGRESS.md` W22 セクションへ「RUN_ID=`20251119TorcaPHRSeqZ1` / TLS OK / HTTP 405/404 / Modernized REST 待ち」および証跡パスを反映済み。`docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md`・`2025-11-18-phr-layerid-ready.md`・`2025-11-13-orca-connectivity.md#7.3` も同内容で更新。

## 5. 次アクションと更新ルール
- 各チェックボックスは進捗に合わせて即日更新し、コメント（例: `→ 11/15 13:00 DNS OK。curl 再試行 16:00 予定`）を追記してよい。
- タスク派生時は §2 に追加し、Runbook / 2025-11-15 ログ / DOC_STATUS へも反映させる。
- このファイルは ORCA 接続検証タスクの唯一のマネージャー記録とし、進捗共有やリマインダで常に参照する。

## 6. 参照ドキュメントマップ
| 種別 | ドキュメント | 役割 / 更新トリガ |
| --- | --- | --- |
| Runbook & API ステータス | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`<br/>`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` | 手順・RUN_ID テンプレ／API 実測一覧。RUN 実施後は必ず両方を更新。 |
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md`（Run 表）<br/>`docs/server-modernization/phase2/operations/logs/2025-11-19-phr-seq-phaseCDE.md` ほか | DNS/TLS/curl/PHR 再測ログ。Run 追加ごとに新規ファイルを生成しリンク。 |
| API ドキュメント連携 | `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`<br/>`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` | API 配置の一次情報。ORCA Runbook 更新時は該当セクションへのリンクを確認。 |
| 公式仕様アーカイブ | `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md` | firecrawl 取得済み仕様。Api_Result 差分や HTTP405 時の仕様確認で参照。 |
| 棚卸し | `docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84 | 「モダナイズ/外部連携（ORCA）」行を更新。RUN_ID・証跡パス・課題を追記。 |
| 割当オーバービュー | `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | 領域マッピングの最新化。行「ORCA 接続実測」に本チェックリストとの整合を記載。 |

> 参照マップの内容が変わった場合は、Runbook/ログ/DOC_STATUS/Assignment Overview を同時更新し、チェックリスト §2 の該当タスクにコメントを追加する。

> 最終更新: 2025-11-19 / 担当: Codex（Phase2 ORCA 接続マネージャー）
