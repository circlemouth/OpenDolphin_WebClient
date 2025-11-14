# Phase2 ORCA Connectivity Run マネージャーチェックリスト（2025-11-20）

## 1. 背景
- `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3（P0 API セット）と §4.3.1（curl 雛形・evidence 初期化）は WebORCA トライアルサーバー（`https://weborca-trial.orca.med.or.jp`）＋ BASIC 認証 `trial/weborcatrial` 向けの CRUD フローへ更新済。RUN_ID は `20251120TrialAppointCrudZ1 / ...TrialAppointWriteZ1 / ...TrialMedicalCrudZ1 / ...TrialAcceptCrudZ1` を共通利用する。
- トライアル環境の公式案内・利用不可機能は `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` を唯一の参照元とし、ドキュメントへ引用する際は同ファイルの更新日時を明記する。
- 運用ポリシー: 「新規登録／更新／削除 OK（トライアル環境でのみ）」を明示し、旧 WebORCA 本番・ORCAcertification・PKCS#12 ベースのアクセスや seed 投入は禁止。コマンド例はすべて `curl -u trial:weborcatrial ...` 形式へ統一し、書込みごとにリクエスト/レスポンス/担当者を記録する。
- CRUD 記録: UI/HTTP いずれの書込みも `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`（日次ログ）と `artifacts/orca-connectivity/<RUN_ID>/crud/`（payload・レスポンス・スクリーンショット）へ保存し、`docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84「モダナイズ/外部連携（ORCA）」へ反映する。
- `docs/server-modernization/phase2/operations/assets/seeds/*.sql` や PRF/seed 関連ファイル（例: `assets/seeds/api21_medical_seed.sql`）は「参考アーカイブ（更新不可）」として扱い、調査時は参照元をコメントに残す。
- PHR 系 RUN_ID も `20251121TrialPHRSeqZ1` へ切替済。証跡は `artifacts/orca-connectivity/20251121TrialPHRSeqZ1/`、ログは `docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` を起点に CRUD 許可フローへ連携する。

## 2. タスクボード（チェックボックス運用）
- [ ] **タスクA: トライアルデータ確認＋必要登録/削除** — 担当A
  - [ ] WebORCA トライアル UI（マスターメニュー → 01 医事業務）で患者 00000001 / 医師 00001 / 保険 06123456 / 直近日受付・予約 / 診療行為が存在するかを確認し、結果を `artifacts/orca-connectivity/<RUN_ID>/data-check/` にスクリーンショット＋メモで保存。
  - [ ] データ欠落時はトライアル環境で「新規登録／更新／削除 OK（トライアル環境でのみ）」を宣言したうえで UI もしくは `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api01rv2/acceptmodv2 -H 'Content-Type: application/json' -d @payloads/accept_new.json` などの CRUD を実施。操作ログを `crud/<endpoint>/` と `docs/.../2025-11-20-orca-trial-crud.md` に追記し、タイムスタンプ・入力項目・`Api_Result` を併記する。
  - [ ] `trialsite.md`「お使いいただけない機能一覧」に該当する操作（例: レセプト一括作成）は実行せず、該当箇所を引用して Blocker としてログ化。
  - [ ] 【ワーカー報告】では確認対象、実施 CRUD、ログパス、使用サンプルデータ ID、DOC_STATUS 反映状況を記載。
  - **進捗メモ（2025-11-20 RUN_ID=`20251120TrialCrudPrepZ1`）:** `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api01rv2/appointlstv2 -d @payloads/appointlst_patient00000001.json` を実行し、HTTP 200 / `Api_Result=00` を取得。UI での追加受付と合わせて `artifacts/orca-connectivity/20251120TrialCrudPrepZ1/crud/appointlstv2/` へログ化し、欠落患者は UI の「外来受付登録」で補完済。
- [ ] **タスクB: トライアル UI 画面証跡** — 担当B（A 完了後に着手）
  - [ ] トライアル UI で Department=01 / Physician=00001 の予約・受付一覧を表示し、CRUD 前後の画面を `artifacts/orca-connectivity/<RUN_ID>/ui/` に保存。キャプションへ `trial/weborcatrial` で実行した旨と操作日時を記載。
  - [ ] 予約/受付を新規登録・更新・削除した場合は、操作手順と `trialsite.md` 参照箇所をログへ追記し、「公開環境につき実データを登録しない」注意喚起を含める。
  - [ ] 【ワーカー報告】では取得日時、画面名、CRUD 内容、スクリーンショットパス、残課題を列挙。
- [ ] **タスクC: curl 実行 & 証跡採取（Trial CRUD 4 RUN）** — 担当C（B 完了後）
  - [ ] DNS/TLS 事前チェック（`nslookup weborca-trial.orca.med.or.jp`, `openssl s_client -connect weborca-trial.orca.med.or.jp:443`）を各 RUN_ID 直前に実施し、`dns/`, `tls/` へ保存。
  - [ ] `20251120TrialAppointCrudZ1`: `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api01rv2/appointlstv2 -d @payloads/appointlst.json` で HTTP 200 / `Api_Result=00` を取得し、Task-A の UI 結果と整合を記録。
  - [ ] `20251120TrialAppointWriteZ1`: `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/orca14/appointmodv2 -d @payloads/appoint_insert.json` で実際に予約を作成／更新。レスポンスと UI での反映を `crud/appointmodv2/` に保存。
  - [ ] `20251120TrialMedicalCrudZ1`: `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api/api21/medicalmodv2 -d @payloads/medical_update.json` を実行し、`Api_Result` と `medicalres` 差分を `crud/medicalmodv2/` に記録。必要に応じ `trialsite.md` の制限（CLAIM 通信不可等）を引用。
  - [ ] `20251120TrialAcceptCrudZ1`: `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api01rv2/acceptlstv2 -d @payloads/acceptlst.json` で 200 or 21 を取得し、受付 CRUD 結果と照合。
  - [ ] 各 curl 後に `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` RUN_ID 表へ結果を追記し、`DOC_STATUS.md` 行 79-84 に証跡 URL を反映。
- [ ] **タスクD: 証跡整理・ドキュメント反映** — 担当D（A-C の成果を集約）
  - [ ] `2025-11-15-orca-connectivity.md` と `2025-11-20-orca-trial-crud.md` を埋め、目的/スケジュール/事前チェック/CRUD 内容/ログパスを記録。スクリーンショットや `trace/*.log` へのリンクも追記。
  - [ ] `ORCA_CONNECTIVITY_VALIDATION.md` §4.3「想定課題」に Trial CRUD 結果（ログ採取方法、未対応機能）を追記。
  - [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84 を最新ステータスへ更新し、「trialsite 参照済」「CRUD ログ更新済」を明記。
  - [ ] `artifacts/orca-connectivity/20251120Trial*/README.md` を作成し、`httpdump/trace/dns/tls/ui/crud` への導線を一覧化。
  - [ ] 更新ファイルと未完了点を 【ワーカー報告】 で共有。
- [ ] **タスクE: PHR Phase-C/D/E トライアル実測（RUN_ID=20251121TrialPHRSeqZ1）** — 担当E
  - [ ] `scripts/orca_prepare_next_run.sh` でテンプレ展開し、`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/{README.md,httpdump,trace,serverinfo,wildfly,screenshots,crud}` を作成。
  - [ ] `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/20/adm/phr/phrreq` 等のエンドポイントで Phase-C/D/E に該当する処理を実行し、レスポンス 200/403/404 をすべて `crud/phr0X/` と `logs/2025-11-21-phr-seq-trial.md` へ記録。未提供機能は `trialsite.md` の該当節を引用し、Blocker として整理。
  - [ ] Modernized REST 側で 200/403 が得られた場合は `serverinfo/claim_conn.json` と `wildfly/phr_*.log` を更新し、`d_audit_event` 採取状況をメモ。
  - [ ] `DOC_STATUS.md` W22 行と `PHASE2_PROGRESS.md` W22 セクションへ RUN_ID・CRUD 結果・Blocker を同期。

## 3. 進捗確認ポイント
- [ ] **Check A**: Trial データ確認結果（UI/CRUD ログ）と欠落時の追加入力記録。
- [ ] **Check B**: UI 画面証跡が CRUD 前後で揃っているか（スクリーンショット＋ログ）。
- [ ] **Check C1-C4**: 各 RUN_ID の DNS/TLS 記録、`curl -u trial:weborcatrial` コマンド、`Api_Result`、`Allow` ヘッダー有無。
- [ ] **Check D**: Runbook + `2025-11-20-orca-trial-crud.md` + DOC_STATUS + Artifacts の同期状況。完了後は本チェックリスト冒頭へ完了日を記載。
- [ ] **Check PHR**: RUN_ID=`20251121TrialPHRSeqZ1` の CRUD ログ、`trialsite.md` 参照箇所、Modernized REST での 200/403＋`d_audit_event` 取得状況。
- 進捗が滞った場合は代替ワーカーを再割当てし、該当タスクのチェックボックス横へ注記する。

## 4. ワーカー指示・報告テンプレ
- 指示接頭辞 `【ワーカー指示】` はタスクA〜E へ割当済。報告時は以下テンプレ厳守：
  1. RUN_ID（複数可 / ドキュメント作業のみは `RUN_ID=NA`）。
  2. 実施内容（UI 手順 / `curl -u trial:weborcatrial ...` コマンド / 編集ファイル）。
  3. 使用端末と DNS/TLS チェック結果。
  4. 証跡ディレクトリ（`artifacts/.../crud` `logs/...` `ui/...` など）とスクリーンショット有無。
  5. 「新規登録／更新／削除 OK（トライアル環境でのみ）」表記の有無、及びログ記載場所。
  6. `DOC_STATUS.md` 更新有無と該当行。

### 【ワーカー報告】Task-C（2025-11-20 10:30 JST / 担当: Codex）
- RUN_ID: `20251120TrialMedicalCrudZ1`
- 実施内容: `curl -u trial:weborcatrial https://weborca-trial.orca.med.or.jp/api/api21/medicalmodv2 -H 'Content-Type: application/json' -d @payloads/medical_update_patient00000001.json` を実行し、新規行為を登録。レスポンス（HTTP200/`Api_Result=00`）と UI の診療行為一覧スクリーンショットを `artifacts/orca-connectivity/20251120TrialMedicalCrudZ1/crud/medicalmodv2/` へ保存。
- 使用端末 / DNS: WSL2（generateResolvConf=false）。`openssl s_client -connect weborca-trial.orca.med.or.jp:443` で TLS1.3 ハンドシェイクを確認。
- 証跡パス: `artifacts/orca-connectivity/20251120TrialMedicalCrudZ1/{crud,ui,trace}/`、`docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`。
- 課題・フォローアップ: `/api/api21/medicalmodv2` で削除要求を投げると `Api_Result=K1`（仕様上不可）となるため `trialsite.md#limit` を引用して Blocker として記録。代替案として UI の取消手順を Task-B へ連携。
- DOC_STATUS / 週次更新: `docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84 へ RUN_ID・CRUD 証跡・残課題を追記、`PHASE2_PROGRESS.md` ORCA セクションにも同内容を反映。

## 5. 次アクションと更新ルール
- 各チェックボックスは進捗に合わせて即日更新し、コメント（例: `→ 11/20 13:00 DNS OK。appointmodv2 再実行 16:00 予定`）を追記可。
- タスク派生時は §2 に追加し、Runbook / 2025-11-20 ログ / DOC_STATUS を同日に更新。`trialsite.md` 由来の注意事項を必ず引用する。
- 本チェックリストは ORCA トライアル接続タスクの唯一のマネージャー記録であり、進捗共有やリマインダで常に参照する。

## 6. 参照ドキュメントマップ
| 種別 | ドキュメント | 役割 / 更新トリガ |
| --- | --- | --- |
| Trial Runbook & API ステータス | `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`<br/>`docs/server-modernization/phase2/operations/ORCA_API_STATUS.md` | Trial CRUD 手順・RUN_ID テンプレ／API 実測一覧。RUN 実施後は必ず両方を更新。 |
| トライアル公式案内 | `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` | 資格情報・利用不可機能の一次情報。引用時は節名と更新日を明記。 |
| ログ & 証跡 | `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`<br/>`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` ほか | CRUD ログ・PHR 実測ログ。RUN 追加ごとに新規ファイルを作成しリンク。 |
| API ドキュメント連携 | `docs/server-modernization/phase2/operations/MODERNIZED_API_DOCUMENTATION_GUIDE.md`<br/>`docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md` | API 配置の一次情報。Trial CRUD 結果との整合を保つ。 |
| 公式仕様アーカイブ | `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md` | firecrawl 取得済み仕様。`Api_Result` 差分や HTTP 応答根拠を確認する。 |
| 棚卸し | `docs/web-client/planning/phase2/DOC_STATUS.md` 行 79-84 | 「モダナイズ/外部連携（ORCA）」行のステータス。Trial CRUD 反映後に更新。 |
| 割当オーバービュー | `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` | 領域マッピング。`ORCA 接続実測` 行に本チェックリストの進捗を連携。 |

> 参照マップを更新した場合は、Runbook/ログ/DOC_STATUS/Assignment Overview を同日に整合させる。

> 最終更新: 2025-11-20 / 担当: Codex（Phase2 ORCA 接続マネージャー）
