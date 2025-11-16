# ORCA ↔ Web クライアント API 関係マッピング（RUN_ID=20251116T101200Z）

## 0. 参照チェーンと前提
- 本メモは `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → 各 ORCA マネージャーチェックリストの順で確認した上で、Legacy サーバー実装（`server/src/main/java`）を調査した結果を整理している。RUN_ID は `20251116T101200Z` で固定し、追加ログや証跡が発生する場合も同じ ID を使う。
- 調査対象は Web クライアントが呼び出す旧サーバー REST（`open.dolphin.rest.*`）と ORCA ラッパー（`open.orca.rest.OrcaResource`）。Legacy サーバー／クライアント資産は参照専用であり、ソースコードの読み取りのみ実施した。
- ORCA 連携は `custom.properties` の `claim.conn=server` を前提としたサーバー直結モードを分析した。トライアル接続は `https://weborca-trial.orca.med.or.jp/`（`trial/weborcatrial`）のみ許可されているため、本メモでも他環境は扱わない。

## 1. 接続構成（custom.properties / ORCAConnection）
- `open.orca.rest.OrcaResource` は起動時に `custom.properties` を読み、JMARI・`rp.default.inout`・`claim.conn` に応じて ORCA 病院番号（`tbl_syskanri` 1001）と DB バージョン（`tbl_dbkanri` ORCADB00）を取得して以降の ORCA DB クエリに使う。`claim.conn=client` の場合は ORCA DB との直結を中断する設計。`server/src/main/java/open/orca/rest/OrcaResource.java:96`。
- 物理接続は `ORCAConnection` シングルトンが担当し、`claim.jdbc.url`/`claim.user`/`claim.password` を直接 `DriverManager` へ渡すか、未設定時は `java:jboss/datasources/ORCADS` から DataSource ルックアップする。取得した `Connection` は `setReadOnly(true)` でマスタ参照用途に限定される。`server/src/main/java/open/orca/rest/ORCAConnection.java:25`。
- Docker 開発用の標準設定は `ops/shared/docker/custom.properties` にあり、`claim.conn=server`、ORCA JDBC URL、CLAIM 送信ホスト/ポート/エンコーディング、施設情報（JMARI 等）がテンプレートとして提示されている。`ops/shared/docker/custom.properties:4`。

## 2. Web クライアント → ORCA：病名登録フロー
### 2.1 HTTP エントリーポイント
- Web クライアント（Charts/Diagnosis UI）は REST `POST /karte/diagnosis/claim` を呼び出し、`DiagnosisSendWrapper`（患者情報 + 追加/更新/削除済み病名 + `sendClaim` フラグ）を JSON で送信する。`server/src/main/java/open/dolphin/rest/KarteResource.java:367`。

### 2.2 サーバー内での保存
- `KarteServiceBean#postPutSendDiagnosis` は `EntityManager` を通じて `RegisteredDiagnosisModel` を削除→更新→追加の順で反映し、新規レコードの PK を返す。`server/src/main/java/open/dolphin/session/KarteServiceBean.java:903`。
- 永続化された病名はローカル DB（`registered_diagnosis` テーブル）に残り、`DiagnosisAuditRecorder` が追加/更新を監査用に記録する。`server/src/main/java/open/dolphin/session/KarteServiceBean.java:1001`。

### 2.3 CLAIM（ORCA）送信
- `sendClaim=true` かつ `confirmDate` が埋まっている場合、`custom.properties` から `claim.conn`, `claim.host`, `claim.send.port`, `claim.send.encoding` をロードし、`claim.conn=server` のときだけ `DiagnosisSender` を直接起動する。`server/src/main/java/open/dolphin/session/KarteServiceBean.java:937`。
- `DiagnosisSender` は `custom.properties` の `diagnosis.claim.send` が `false` なら即座に終了し、`added/updated/deleted` のリストを統合・ソートしたうえで CLAIM 形式の `DiseaseHelper` を Velocity テンプレート `diseaseHelper.vm` に流し込み、ソケット経由（ACK/NAK を解析）で ORCA に送信する。`server/src/main/java/open/dolphin/msg/DiagnosisSender.java:15`。
- 送信済み病名は `RegisteredDiagnosisModel` に `DORCA_UPDATED` フラグを立て、次回以降の CLAIM 送信対象から除外される。`server/src/main/java/open/dolphin/msg/DiagnosisSender.java:147`。

## 3. ORCA → Web クライアント：病名インポート
- Web クライアント側の「ORCA 病名取り込み」は `GET /orca/disease/import/{patientId,from,to,ascend}` を叩き、`OrcaResource#getOrcaDisease` が ORCA DB から病名を引いて `RegisteredDiagnosisListConverter`（JSON）として返す。`server/src/main/java/open/orca/rest/OrcaResource.java:1429`。
- 処理手順:
  1. `tbl_ptnum` から院内患者番号 (`ptnum`) を ORCA 内部 ID (`ptid`) へ解決し、対象患者が ORCA で登録済みか確認する。
  2. `tbl_ptbyomei` を `sryymd`（診療日）と `dltflg!=1` で絞り込み、疑い/主病名/転帰コードを `RegisteredDiagnosisModel` の `category`/`outcome` へ変換する。`server/src/main/java/open/orca/rest/OrcaResource.java:1485`。
  3. ステータスが「疑い」「主病名」の判定は `storeSuspectedDiagnosis`／`storeMainDiagnosis`、転帰は `storeOutcome` が文字列変換を行う。`server/src/main/java/open/orca/rest/OrcaResource.java:1766`。
- `GET /orca/disease/active/{patientId,ascend}` では期間指定を省略し、`tbl_ptbyomei` の未終了エントリだけを返す。Web クライアントは結果を確認後、必要なレコードを `POST /karte/diagnosis/claim` に載せ替えてローカル DB と ORCA 双方向で整合を取る。
- インポート API は DB 読み取り専用であり、サーバー側で追加保存は行われない（ユーザーが選択して送信したタイミングで初めて `RegisteredDiagnosisModel` が作成される）。

## 4. ORCA マスタ／処方 UI 連携
### 4.1 点数／薬剤マスタ検索
- `GET /orca/tensu/shinku|name|code|ten` で `tbl_tensu` を直接検索し、`TensuMaster` リスト（診療行為コード、名称、点数、入院/外来区分、薬価基準など）を JSON で返す。検索条件は `srysyukbn`/名称正規表現/コード帯/点数帯で共通し、有効期間 (`yukostymd`〜`yukoedymd`) もサーバー側でフィルタされる。`server/src/main/java/open/orca/rest/OrcaResource.java:261`。
- Web クライアントはこのリストを元にスタンプ（処方・検査・手技など）を構成し、ローカル DB にはスタンプツリーだけを保存する。Master 値自体は都度 ORCA DB に照会するため、同期ジョブは不要。

### 4.2 入力セット → スタンプ化
- `GET /orca/inputset` は `tbl_inputcd` の入力セット（約束処方/診療セット）メタ情報を列挙し、Web クライアントのスタンプボックスで ORCA セット一覧として表示する。`server/src/main/java/open/orca/rest/OrcaResource.java:824`。
- `GET /orca/stamp/{setCd,stampName}` は `tbl_inputset` と `tbl_tensu` を join してセット明細を `ModuleModel` 配列へ変換する。サーバー側では有効期間 (`yukostymd/yukoedymd`) と RP（院内/院外）既定値を確認し、RP/放射線/一般などのエンティティを `ModuleInfoBean` に付与する。`server/src/main/java/open/orca/rest/OrcaResource.java:948`。
- 取得した `ModuleModel` 群は Web クライアント側でスタンプ（テンプレート）として保存され、実際のカルテ保存時には通常の `POST /karte/modules` フローで `ModuleModel` を DB に永続化する。

### 4.3 相互作用・一般名・診療科情報
- `PUT /orca/interaction` では Web クライアントが送信した薬剤コード群を元に `tbl_interact`/`tbl_sskijyo` を検索し、併用禁忌情報を `DrugInteractionModel` として返却する。`server/src/main/java/open/orca/rest/OrcaResource.java:709`。
- `GET /orca/general/{srycd}` は薬剤コードに紐づく一般名を `tbl_genericname` から求め、既定の `CodeNamePack` で応答する。`server/src/main/java/open/orca/rest/OrcaResource.java:774`。
- `GET /orca/deptinfo` は `custom.properties` の `orca.orcaapi.*` が設定されている場合、`OrcaConnect`（HTTP API クライアント）で `/api01rv2/system01dailyv2` 相当の ORCA API を呼び出し、診療科とドクターコード対応表を取得している。結果は CSV ライクなテキストに変換され、Web クライアントの受付/予約画面で担当医初期値として利用される。`server/src/main/java/open/orca/rest/OrcaResource.java:1729`。

## 5. データ取り扱いサマリ
| Direction | 対象 API | Legacy サーバー処理 | 保存先 / 取り扱い |
| --- | --- | --- | --- |
| Web → Server → ORCA | `POST /karte/diagnosis/claim` | `KarteServiceBean` が `RegisteredDiagnosisModel` を CRUD、`DiagnosisSender` が CLAIM をソケット送信。 | ローカル DB（診療録）に加えて ORCA へ実時間同期。`sendClaim=false` ならローカル保存のみ。 |
| ORCA → Server → Web | `GET /orca/disease/{import,active}` | `OrcaResource` が `tbl_ptnum`/`tbl_ptbyomei` を SELECT し、疑い/転帰などを `RegisteredDiagnosisModel` へマッピング。 | 取得結果はレスポンスのみ。ユーザーが再登録した時点で `RegisteredDiagnosisModel` が生成される。 |
| ORCA → Server → Web | `GET /orca/tensu/*`, `/orca/inputset`, `/orca/stamp/{cd}` | ORCA DB の点数・入力セットを抽出し、`TensuMaster`/`ModuleModel` として返却。 | マスタは都度参照。Web クライアントはスタンプ/オーダーのコピーだけをローカル DB に保持。 |
| Web → Server（参照のみ） | `PUT /orca/interaction`, `GET /orca/general/{srycd}` | ORCA DB で相互作用や一般名を照会。 | レスポンスのみ。ローカル DB への保存は行わない。 |
| Server → ORCA HTTP | `GET /orca/deptinfo` | `OrcaConnect` が公式 ORCA API へ XML/HTTP でアクセス。 | JSON/CSV に整形してクライアントへ返すのみ。 |

## 6. 追加メモ / TODO
- 現状の Legacy 実装では ORCA 連携ログを `DiagnosisAuditRecorder` と CLAIM ACK/NAK ログでしか保持しないため、Phase2 で要件化された RUN_ID ベースの証跡（`docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md`）へもリンクする必要がある。`PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` のアーカイブ TODO（2025-11-29 期限）に従い、Modernized 側の `ServerInfoResource` で `claim.conn` 状態を揃えてから運用ログへ転記する。
- `OrcaResource` は ORCA DB のスキーマバージョン（4.5/4.6/4.7）を静的フィールドに格納しているが、スレッドセーフな更新がなく、稼働中に `custom.properties` を差し替えても反映されない。モダナイズ版へ移す際は `@Singleton` 再起動無しでの再読込要否を整理する。

