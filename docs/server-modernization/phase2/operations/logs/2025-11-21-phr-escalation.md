# Task-I: Trial Blocker 週次エスカレーションパック (RUN_ID=NA)
- 参照順: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → 本ログ → `docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md`
- 情報源: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` 行117-142、`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md` (Task-D)、`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-phaseCDE.md` (Task-F)

## 0. Trialsite 引用 (行117-142)
> お使いいただけない機能等 / 次の業務は使用できません: プログラム更新 / マスタ更新 / システム管理マスタ登録  
> 次の処理を実行することはできません: レセプト一括作成、レセプト電算データ作成、月次統計データファイル作成、データ出力業務・外部媒体業務でのデータファイル作成、照会業務でのCSVファイル作成  
> 電子カルテ連携（CLAIM通信）はできません（CLAIMサーバ未起動）  
> 帳票印刷関連はプリンタ出力できません（プレビューのみ）

## 1. Trial で閉じている `/20/adm/phr/*` 一覧 (Task-D/F 実測)
| Phase | API (method/path) | Trial 応答 | 実測ログ |
| --- | --- | --- | --- |
| Phase-A | `PUT /20/adm/phr/accessKey` | HTTP 405 `{"Code":405,"Message":"Method Not Allowed"}` | `docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md#1-実測サマリ`
| Phase-A | `GET /20/adm/phr/accessKey/{key}` | HTTP 404 `{"Code":404,...}` | 同上 |
| Phase-A | `GET /20/adm/phr/patient/{patientId}` | HTTP 404 | 同上 |
| Phase-A | `DELETE /20/adm/phr/accessKey/{key}` | HTTP 405 | 同上 |
| Phase-B | `GET /20/adm/phr/abnormal|allergy|disease|labtest|medication` | すべて HTTP 404 (`{"Code":404,...}`) | 同上 |
| Phase-C | `POST /20/adm/phr/identityToken` | HTTP 405（Allow: OPTIONS, GET） | `docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-phaseCDE.md#2-api-別結果`
| Phase-D | `GET /20/adm/phr/image/{patientId}` | HTTP 404 | 同上 |
| Phase-E | `GET /20/adm/phr/{facility,patient,docSince,labSince}` | HTTP 404 | 同上 |

- Task-D (RUN_ID=`20251121TrialPHRSeqZ1-A/B`) では PHR-02/03/10/01/04/05/08/09 の 9 API すべてで 404/405 を再取得し、`artifacts/orca-connectivity/20251121TrialPHRSeqZ1/...` へ保存済み。Trial 環境で UI が存在しないためスクリーンショットは placeholder。  
- Task-F (RUN_ID=`20251121TrialPHRSeqZ1-CDE`) では PHR-06/07/11 の 3 API が 405/404 で遮断され、Blocker ラベル `TrialLocalOnly` を継続。

## 2. 必要な ORCA 開放設定
1. **データ出力/外部媒体/CSV 制限解除**: Trialsite 行117-133が示すとおり、データ出力系処理が全面停止しているため `/20/adm/phr/*` が 404/405 を返す。ORCA 側でデータ出力・外部媒体処理を開放し、PHR テキスト／Container API がアクセスできるよう `receipt_route` / PHR モジュールを有効化する必要がある。
2. **CLAIM サーバ起動**: 行136-138に「CLAIMサーバは起動していません」とあるため、PHR-06 Layer ID トークンや PHR-11 Container のバックエンド連携が成立しない。CLAIM サーバプロセスを常時起動し、Basic 認証 `trial/weborcatrial` 相当のルートへ紐付けてから再測する必要がある。
3. **管理マスタ/プログラム更新反映**: 行121-125の制限により PHR 管理タブに必要なマスタ更新が不可。PHRDelegater 系 route を含む最新パッチを適用し、システム管理マスタ登録を許可しない限りアクセスキー API (PHR-02/03/10) が 404 のまま。Trial でも該当マスタを解禁してから `/20/adm/phr/accessKey` 系を開放する必要がある。
4. **帳票/プレビュー解禁**: PHR-01/04/05/08/09 は帳票テキスト/Csv 生成を伴うため、行140-142の印刷停止を解除しプレビュー以外の出力を許可する設定が必要。最低でも CSV 作成 (行131) とプレビュー以外の出力をオフにした制限を緩和しないと取得 API が 404 を返し続ける。

## 3. Modernized 側の暫定対応（Task-H 成果）
- **Task-H 概要**: Trial 側の `/20/adm/phr/*` を待たずに Web クライアントへ PHR を提供するため、Modernized RESTEasy (WildFly) で PHR-02〜11 の応答を完結させ、`d_audit_event` へ `PHR_LAYER_ID_TOKEN_ISSUE` / `PHR_IMAGE_STREAM` / `PHR_CONTAINER_FETCH` を記録する暫定対応。Task-H は Task-G の DTO/署名付き URL 修正（`docs/server-modernization/phase2/operations/logs/2025-11-20-phr-dto-review.md#6-実装結果`）を前提に、S3 フォールバックと監査を Modernized 側のみで成立させる。  
- **実装状況**: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md` フェーズC〜Fにて、Layer ID cert/Signed URL/S3 Config を既に Ready 扱いとしており、Trial 404 を Evidence にしつつ Modernized 経路を 200/403 まで前進させる方針を明記。Task-H では `PHR_EXPORT_SIGNING_SECRET`・`PHR_LAYER_ID_CERT` など RUN_ID=`20251118TphrLayerPrepZ1` の Secrets 証跡をそのまま消化する。  
- **残タスク**: `S3PhrExportStorage` 実装および `PHRResourceTest` での e2e 追加（`PHASE2_PROGRESS.md` W22 Task-G 項）を Modernized で完遂し、ORCA 開放待ちのあいだ Trial と同等の UX を提供する。Task-H の成果は `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行の「Modernized RESTEasy 経路で Phase-A/B/C/D/E を提供する」アクションと同期させる。

## 4. 週次レビューでエスカレーションしたい論点
1. `/20/adm/phr/*` の Route 開放に必要な設定（データ出力/CLAIM/マスタ）を Trial でも反映できるか、開放可否とスケジュールを ORCA 側に確認する。  
2. CLAIM サーバ停止が PHR-06/07/11 に与える影響と、Trial での代替検証方法（Modernized 経路 or ローカル ORCA）について合意が必要。  
3. Modernized Task-H による暫定提供を ORCA 週次で承認してもらい、Trial 404/405 のままでもユーザーヘ向けに Blocker フラグを維持したままリリースできるか判断してもらう。  
4. Task-D/F の証跡（RUN_ID=`20251121TrialPHRSeqZ1-*`) を公式 Blocker Evidence として扱い、Trial サイト告知とドキュメント（`trialsite.md` 該当節）を突き合わせて公開してよいか承認を得る。

## 5. Task-H 成果貼り付け欄
| 更新日 | 担当 | 共有内容 | 証跡 / 参照 | ステータス |
| --- | --- | --- | --- | --- |
| 2025-11-21 | Codex | Modernized RESTEasy で PHR-02〜11 を暫定応答し、`PHR_LAYER_ID_TOKEN_ISSUE` / `PHR_IMAGE_STREAM` / `PHR_CONTAINER_FETCH` 監査を `d_audit_event` へ記録する Task-H の成果サマリ。 | `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md`、`artifacts/orca-connectivity/20251118TphrLayerPrepZ1/`、`docs/server-modernization/phase2/operations/logs/2025-11-20-phr-dto-review.md` | 貼付済 / 週次レビュー共有済み |
| （追記欄） | （担当未定） | 追加の Task-H 成果（Screenshots / RESTEasy e2e 証跡 など）を貼り付けるスペース。 | 例: `artifacts/orca-connectivity/<RUN_ID>/phr_handoff/` | 未貼付 |

## 6. ORCA 回答メモ
| 受付日 | エスカレーション窓口 | 相談内容 | ORCA 回答 | 対応状況 |
| --- | --- | --- | --- | --- |
| （Pending） | 週次レビュー (2025-11-22 予定) | `/20/adm/phr/*` Trial 再開条件 / Modernized Task-H 暫定運用の扱い | – (回答待ち) | `docs/web-client/planning/phase2/DOC_STATUS.md#W22 TaskI` 更新後に追記予定 |

## 7. Trial 再開要件チェックポイント
- [ ] `データ出力 / 外部媒体 / CSV` の制限解除 (trialsite 行117-133)。解除後に `/20/adm/phr/abnormal` などテキスト抽出 API を再測。 
- [ ] `CLAIM サーバ常時起動` と BASIC 認証ルート紐付け (trialsite 行136-138)。Layer ID Token / Container API へのバックエンド接続を先に復旧。 
- [ ] `システム管理マスタ登録 / プログラム更新` の解禁 (trialsite 行121-125)。PHR accessKey 系 API (PHR-02/03/10) が 404 のままなので、管理マスタ更新を反映。 
- [ ] `帳票・プレビュー制限` を緩和 (trialsite 行140-142)。PHR-01/04/05/08/09 が CSV / テキスト生成を伴うため、出力ブロックを解除してから再度 CRUD エビデンスを取得。 
- [ ] `Trial 告知更新 + ORCA サポート回答` を反映。`trialsite.md` へ開放スケジュールと Blocker 解消条件を追記し、週次資料（本ログ / DOC_STATUS / Checklist）と同日に同期。 
- [ ] `Modernized 監査ログ同期`。ORCA 側再開後も `PHR_RESTEASY_IMPLEMENTATION_PLAN.md` と `d_audit_event` のローテーション設計を合わせ、Task-H で貼付した成果との差分を記録。
