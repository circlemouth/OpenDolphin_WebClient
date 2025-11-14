# ORCA ↔ モダナイズ版サーバー API 差異サマリ（2025-11-14）

## 1. スコープと参照資料
- 対象はモダナイズ版サーバーが ORCA と通信するために定義した 53 API（`assets/orca-api-matrix.with-spec.csv`）のうち、直近で疎通結果や仕様差異が判明しているもの。
- 公式仕様は firecrawl 取得済みの ORCA ドキュメント（`assets/orca-api-spec/manifest.json` および `raw/*.md`）を根拠とし、実測結果は `logs/2025-11-13-orca-connectivity.md`、`notes/orca-api-field-validation.md`、`PHASE2_PROGRESS.md` の RUN_ID 記録を引用する。
- 本サマリは `operations/ORCA_CONNECTIVITY_VALIDATION.md`（検証手順）と `logs/ORCA_HTTP_404405_HANDBOOK.md`（障害時テンプレ）の補助資料として運用する。

## 2. 通信状態別リスト

### 2.1 利用可（仕様差異あり）
| ORCA API (Method) | ORCA 公式仕様抜粋 | 現在の疎通結果 | 差異・備考 |
| --- | --- | --- | --- |
| `/api01rv2/system01dailyv2` (POST) | XML2 フォーマットで日次基本情報を返却。文字コードは明記なし。`manifest.json` No.44 / `raw/system_daily.md` | UTF-8 XML で `Api_Result=00`。Shift_JIS では `Api_Result=91` になるため UTF-8 固定が必須。証跡: `logs/2025-11-13-orca-connectivity.md`、`artifacts/.../weborca-prod/system01dailyv2.*` | 仕様では Shift_JIS も例示されているが、WebORCA クラウド本番は UTF-8 以外を受け付けないことが判明。`notes/orca-api-field-validation.md` の Runbook に従ってテンプレを UTF-8 へ統一済み。 |
| `/api01rv2/acceptlstv2` (POST) | 当日受付一覧を返却、`Api_Result=00` で受付行が返ると記載。`manifest.json` No.5 / `raw/acceptancelst.md` | HTTP 200 は取得できるがデータ前提により `Api_Result=13/14/21`。ダミー受付 Seed（RUN_ID=`20251113TorcaP0OpsZ3`）投入後に `Api_Result=00` を確認。証跡: `logs/2025-11-13-orca-connectivity.md`, `PHASE2_PROGRESS.md` W18/W21/W36 | 公式仕様は医師・診療内容が揃っている前提。モダナイズ環境では ORCA DB に医師/診療 seed が無く、手動で登録しない限り `Api_Result=00` にならない。Runbook §4.3 に seed 手順を追記済み。 |
| `/orca12/patientmodv2` (POST) | XML2 で患者新規/更新。患者番号桁数は `ORCBPTNUMCHG` で可変。`manifest.json` No.14 / `raw/patientmod.md` | 8 桁採番（標準 7 桁 + 追加 1 桁）へ DB を揃えた上で送信すると `Api_Result=00`／`Patient_ID=00002` を取得。RUN_ID=`20251113TorcaPatientAutoStdZ1`. | 公式サンプルは 7 桁だが本番 ORCA では追加桁設定が有効になっており、モダナイズ環境も 8 桁前提へ合わせる必要がある。`PHASE2_PROGRESS.md` W56 に検証記録あり。 |

### 2.2 通信不可（HTTP 404/405）
| ORCA API | 公式仕様で期待される挙動 | 実測ステータス | 差異/課題 |
| --- | --- | --- | --- |
| `/api01rv2/patientgetv2` | POST で患者基本情報を返却（No.1 / `raw/patientget.md`）。 | WebORCA クラウドでは 404（Allow 無し）。RUN_ID=`20251113TorcaP0OpsZ1/Z2`. | ルーティング自体が公開されておらず、公式仕様（POST/Api_Result=00）が再現できない。ORCA 側で REST ルートを開放する必要がある。`PHASE2_PROGRESS.md` W18 を参照。 |
| `/orca14/appointmodv2` | 予約登録・取消 API（No.2 / `raw/appointmod.md`）。 | 405（Allow: OPTIONS, GET）。RUN_ID=`20251113TorcaP0OpsZ1/Z2`. | POST が拒否されており、予約登録フローを実行できない。`ORCA_HTTP_404405_HANDBOOK.md` に沿って 405 証跡済み。 |
| `/api21/medicalmodv2` | 診療行為登録（No.3 / `raw/medicalmod.md`）。 | 405（Allow: OPTIONS, GET）。RUN_ID=`20251113TorcaP0OpsZ1/Z2`. | ORCA 仕様では class=01-03 の POST を受けるが、本番環境では GET しか開いていない。医師マスタを整備しても 405 のまま。 |
| `/orca11/acceptmodv2` | 受付登録/取消（No.4 / `raw/acceptmod.md`）。 | 405（Allow: OPTIONS, GET）。RUN_ID=`20251113TorcaP0OpsZ1/Z2`. | 受付登録をモダナイズ側から発行できず、現時点では ORCA UI での手動登録のみ。 |
| `/api21/medicalmodv23` | 初診算定日登録（No.46 / `raw/medicalmodv23.md`）。 | 405（Allow: OPTIONS, GET）。RUN_ID=`20251113T002806Z` W19。 | `notes/orca-api-field-validation.md` が示す通り、XML へ整形しても 405。ORCA サーバーの REST 有効化または route 公開が必要。 |
| `/orca06/patientmemomodv2` | 患者メモ CRUD（No.53 / `raw/patientmemomodv2.md`）。 | 405（Allow: GET）。RUN_ID=`20251113T002806Z` W19。 | JSON→XML へ修正後も 405。ORCA 本番で POST を閉じている。 |
| `/orca31/hspmmv2` | 入院会計未作成チェック（No.39 / `raw/hspmm.md`）。 | 405（Allow: OPTIONS, GET）。RUN_ID=`20251113T002806Z` W19。 | ORCA 仕様では POST で `Perform_Month` を送るが、現環境は GET のみ開放。 |

### 2.3 モダナイズ側未実装（ラッパー未提供）
| ORCA API 群 | 公式仕様 | モダナイズ版サーバーの現状 | 差異 |
| --- | --- | --- | --- |
| `/api01rv2/patientlst1v2`, `/patientlst2v2`, `/patientlst3v2` など患者一括取得系 (manifest No.8-10) | 受付/患者同期のバッチ API を POST で提供。 | `MODERNIZED_REST_API_INVENTORY.md` の ORCA 節にはこれらの HTTP ラッパーは存在せず、Web クライアント向けには `GET /orca/disease/*` や `/orca/tensu/*` などのローカル DB 参照エンドポイントのみが公開されている。 | ORCA 仕様との差分として、モダナイズ版サーバーは患者一括取得をまだ HTTP 経由で再実装していない。既存クライアントからは直接 ORCA API を叩く必要がある。 |
| `/api01rv2/appointlst2v2`, `/api01rv2/acsimulatev2`, `/orca25/subjectivesv2` 等予約・請求・症状 API (manifest No.15-17) | 予約詳細 / 請求試算 / 症状詳記 API を POST 提供。 | `OrcaResource` には予約・請求系の REST エンドポイントが未定義（`MODERNIZED_REST_API_INVENTORY.md` では点数/病名/スタンプ連携のみ列挙）。 | ORCA 文書にある高優先度 API がモダナイズ版サーバーにはまだ実装されていないため、Web クライアントから直接 ORCA を呼び出す代替策が必要。 |

## 3. 次アクション
1. **POST 405/404 の解消**: `patientgetv2` など P0 API について、WebORCA クラウドのルート公開状況をサポートへ問い合わせ、`ORCA_HTTP_404405_HANDBOOK.md` の手順で再検証する。Runbook §4.5 に問い合わせテンプレを追加する。
2. **UTF-8/桁数ルールの恒常化**: `system01dailyv2` の UTF-8 必須や `patientmodv2` の 8 桁制約を `ops/modernized-server/docker/custom.properties`（エンコーディング）と Web クライアント UI（入力バリデーション）へ反映する。
3. **モダナイズ側ラッパー整備**: `patientlst*`, `acsimulatev2` などが `OrcaResource` に存在しないため、`orca-api-matrix` の P0/P1 を優先にサーバー REST 実装を追加し、`MODERNIZED_REST_API_INVENTORY.md` に追記する。
4. **台帳同期**: 本サマリで判明したステータスを `orca-api-matrix.with-spec.csv` の備考列にも転記し、API ごとの対応状況を一元化する。

---

- 参考: [`assets/orca-api-spec/manifest.json`](assets/orca-api-spec/manifest.json)、[`logs/2025-11-13-orca-connectivity.md`](logs/2025-11-13-orca-connectivity.md)、[`notes/orca-api-field-validation.md`](../notes/orca-api-field-validation.md)、[`PHASE2_PROGRESS.md`](../PHASE2_PROGRESS.md)、[`MODERNIZED_REST_API_INVENTORY.md`](../../MODERNIZED_REST_API_INVENTORY.md)
