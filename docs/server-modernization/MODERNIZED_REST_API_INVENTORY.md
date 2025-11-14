# モダナイズ版サーバー REST API インベントリ

- 作成日: 2026-XX-XX
- 対象: `server-modernized/src/main/java/open/dolphin/**` および `open/orca/rest` に実装されている Jakarta EE ベースのモダナイズ版サーバー API。
- 前提: 現行実装は旧サーバー互換のため `userName` / `password(MD5)` / `clientUUID` ヘッダーを引き続き要求し、施設 ID はアプリケーションサーバーの `RemoteUser` から解決する。JSON シリアライザは Jackson 2.x だが、戻り値の多くは後方互換のため `application/octet-stream` を指定している。
- 注意: 本一覧はモダナイズ工程で Jakarta API へ移行済みの REST リソースを網羅する。仕様更新時は当ファイルと `docs/server-modernization/rest-api-modernization.md` の整合を保つこと。

> **【重要】**
> このドキュメントは、モダナイズが**完了した**APIのみを掲載しています。
> `legacy-server-modernization-checklist.md` の注記にある通り、まだ多数のAPIが未移植の状態です。開発に着手する際は、必ず新旧のAPIインベントリを比較し、移植対象かどうかを確認してください。

## 1. 認証・施設・システム情報

### UserResource (`/user`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/user/{userId}` | ログインユーザー本人の情報取得 | `userName` ヘッダーと一致しない場合は `null` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L35-L59】 |
| GET | `/user` | 施設所属ユーザー一覧取得 | 管理者権限を `UserServiceBean#isAdmin` で検証。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L61-L88】 |
| POST | `/user` | ユーザー新規登録 | 施設 ID とロール参照を再構築して保存。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L90-L132】 |
| PUT | `/user` | ユーザー情報更新 | 管理者または本人のみ更新可、権限昇格は追加チェック。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L134-L183】 |
| DELETE | `/user/{userId}` | ユーザー削除 | 管理者のみ。戻り値なし。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L185-L205】 |
| PUT | `/user/facility` | 施設情報更新 | `UserServiceBean#updateFacility` を呼び出し件数を返却。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L207-L223】 |
| GET | `/user/name/{userId}` | ユーザー表示名取得 | 施設認証不要、単純なテキスト応答。【F:server-modernized/src/main/java/open/dolphin/rest/UserResource.java†L226-L230】 |

### SystemResource (`/dolphin`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/dolphin/activity/{yyyy,MM,count}` | 月次活動ログ取得 | `ActivityServiceBean#getActivities` を呼び出す。【F:server-modernized/src/main/java/open/dolphin/rest/SystemResource.java†L70-L102】 |
| POST | `/dolphin/license` | Cloud Zero 向けライセンス登録/検証 | 成功時 `0`、エラーコードは `2`〜`4`。【F:server-modernized/src/main/java/open/dolphin/rest/SystemResource.java†L113-L155】 |
| GET | `/dolphin/cloudzero/sendmail` | CloudZero 月次メール送信 | ライセンスログを出力するのみ。【F:server-modernized/src/main/java/open/dolphin/rest/SystemResource.java†L174-L196】 |

### ServerInfoResource (`/serverinfo`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/serverinfo/jamri` | JMARI コード取得 | `custom.properties` から読み込み。【F:server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java†L33-L53】 |
| GET | `/serverinfo/claim/conn` | CLAIM 接続モード取得 | `SystemServiceBean#getClaimConnectionType` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java†L55-L74】 |
| GET | `/serverinfo/cloud/zero` | Cloud Zero 設定取得 | `SystemServiceBean#getCloudZero` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/ServerInfoResource.java†L76-L95】 |

## 2. 患者・受付・スケジュール

### PatientResource (`/patient`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/patient/name/{name}` | 氏名検索 | 施設内患者を部分一致で取得。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L34-L52】 |
| GET | `/patient/kana/{kana}` | カナ検索 | カナ列で検索。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L53-L72】 |
| GET | `/patient/digit/{digit}` | 生年月日/電話番号検索 | 数字列で検索。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L73-L92】 |
| GET | `/patient/id/{pid}` | 患者 ID 検索 | 単一患者を返却。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L93-L112】 |
| GET | `/patient/pvt/{yyyymmdd}` | 日次来院患者取得 | `patientServiceBean#getPatientsByPvtDate` を利用。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L113-L134】 |
| GET | `/patient/documents/status` | 仮保存カルテ保有患者 | `patientServiceBean#getTmpKarte`。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L135-L156】 |
| POST | `/patient` | 患者登録 | 施設 ID を付与し保存。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L157-L182】 |
| PUT | `/patient` | 患者更新 | `patientServiceBean#update` を呼び出し件数返却。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L183-L210】 |
| GET | `/patient/count/{query}` | 検索件数取得 | 1000件超過時の確認用。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L211-L228】 |
| GET | `/patient/all` | 施設内患者全件取得 | 大量データ応答に留意。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L229-L248】 |
| GET | `/patient/custom/{query}` | カスタム検索（傷病名など） | `patientServiceBean#getCustom` を利用。【F:server-modernized/src/main/java/open/dolphin/rest/PatientResource.java†L249-L263】 |

### PVTResource (`/pvt`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/pvt/{params}` | 受付一覧取得 | パラメータ配列で医師/受付/予約期間を指定。【F:server-modernized/src/main/java/open/dolphin/rest/PVTResource.java†L32-L79】 |
| POST | `/pvt` | 受付登録 | 保険情報の親参照を再構築して保存。【F:server-modernized/src/main/java/open/dolphin/rest/PVTResource.java†L81-L121】 |
| PUT | `/pvt/{pvtPK,state}` | 受付ステータス更新 | 更新件数を返却。【F:server-modernized/src/main/java/open/dolphin/rest/PVTResource.java†L123-L142】 |
| PUT | `/pvt/memo/{pvtPK,memo}` | 受付メモ更新 | 空文字にも対応。【F:server-modernized/src/main/java/open/dolphin/rest/PVTResource.java†L144-L161】 |
| DELETE | `/pvt/{pvtPK}` | 受付削除 | 戻り値なし。【F:server-modernized/src/main/java/open/dolphin/rest/PVTResource.java†L163-L175】 |

### ScheduleResource (`/schedule`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/schedule/pvt/{params}` | 予約/受付一覧取得 | 医師別または日付のみで抽出。【F:server-modernized/src/main/java/open/dolphin/rest/ScheduleResource.java†L32-L70】 |
| POST | `/schedule/document` | 予定カルテ作成＋CLAIM送信 | `PostSchedule` JSON を受け取り一括処理。【F:server-modernized/src/main/java/open/dolphin/rest/ScheduleResource.java†L72-L104】 |
| DELETE | `/schedule/pvt/{pvtPK,ptPK,yyyy-MM-dd}` | 予約削除 | 日付は `yyyy-MM-dd` 指定。【F:server-modernized/src/main/java/open/dolphin/rest/ScheduleResource.java†L106-L136】 |

### AppoResource (`/appo`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| PUT | `/appo` | 予約一覧更新 | `AppoList` JSON を受け取り一括更新件数を返却。【F:server-modernized/src/main/java/open/dolphin/rest/AppoResource.java†L31-L55】 |

## 3. カルテ・診療記録

### KarteResource (`/karte`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/karte/pid/{pid,from}` | 患者 ID 指定カルテ取得 | 施設 ID でフィルタ。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L46-L74】 |
| GET | `/karte/{patientPk,from}` | 患者 PK 指定カルテ取得 | 施設フィルタなし。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L76-L100】 |
| GET | `/karte/docinfo/{karteId,from,includeModified}` | 文書メタ情報一覧 | 変更済み含有フラグ対応。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L102-L138】 |
| GET | `/karte/documents/{docIds}` | 複数文書詳細取得 | 添付バイナリを `null` に差替え。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L140-L176】 |
| POST | `/karte/document` | 新規カルテ保存 | モジュール/シェーマ/添付の親参照を再構築。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L178-L241】 |
| POST | `/karte/document/pvt/{pvtPK[,state]}` | 受付紐付け保存 | 保存後に受付ステータスを更新。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L243-L290】 |
| PUT | `/karte/document/{id}` | 文書タイトル更新 | `DocumentServiceBean#updateTitle`。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L292-L320】 |
| DELETE | `/karte/document/{id}` | 文書削除 | 削除済み文書 ID を `StringList` で返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L322-L362】 |
| GET | `/karte/modules/{karteId,entity,from,to,...}` | モジュール履歴取得 | 期間複数指定に対応。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L364-L410】 |
| GET | `/karte/iamges/{karteId,from,to,...}` | 画像メタ情報取得 | 旧綴り `iamges` を継承。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L412-L454】 |
| GET | `/karte/image/{id}` | 単一画像取得 | `SchemaModelConverter` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L456-L486】 |
| GET | `/karte/diagnosis/{karteId,from[,activeOnly]}` | 病名一覧取得 | `activeOnly` オプション対応。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L488-L526】 |
| POST | `/karte/diagnosis/claim` | 病名登録/更新＋CLAIM送信 | 更新 ID をカンマ区切りで返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L528-L575】 |
| POST | `/karte/diagnosis` | 病名新規登録 | 追加 ID 群を返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L577-L606】 |
| PUT | `/karte/diagnosis` | 病名更新 | 更新件数返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L608-L637】 |
| DELETE | `/karte/diagnosis/{ids}` | 病名削除 | カンマ区切り ID を削除。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L639-L668】 |
| GET | `/karte/observations/{karteId,observation,phenomenon[,date]}` | 観察値取得 | オプション日付あり。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L670-L714】 |
| POST | `/karte/observations` | 観察値登録 | 追加 ID を返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L716-L744】 |
| PUT | `/karte/observations` | 観察値更新 | 更新件数返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L746-L774】 |
| DELETE | `/karte/observations/{ids}` | 観察値削除 | カンマ区切り ID。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L776-L804】 |
| PUT | `/karte/memo` | 患者メモ更新 | `PatientMemoModel` を保存。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L806-L832】 |
| GET | `/karte/freedocument/{patientId}` | フリードキュメント取得 | `facilityPatId` を施設 ID 付きで解決。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L834-L858】 |
| PUT | `/karte/freedocument` | フリードキュメント更新 | `facilityPatId` を上書き。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L860-L886】 |
| GET | `/karte/appo/{karteId,from,to,...}` | 予約履歴取得 | 日付範囲複数指定対応。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L888-L924】 |
| PUT | `/karte/claim` | CLAIM 送信 | 成功で "1"、失敗で "0"。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L926-L951】 |
| GET | `/karte/moduleSearch/{karteId,from,to,entity...}` | Entity 単位モジュール検索 | `documentServiceBean#getModuleSearch`。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L953-L998】 |
| GET | `/karte/docinfo/all/{karteId}` | 全文書取得 | 添付バイナリを `null` に差替え。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L1000-L1032】 |
| GET | `/karte/attachment/{id}` | 添付ファイル取得 | `AttachmentModel` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/KarteResource.java†L1034-L1060】 |

### LetterResource (`/odletter`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| PUT | `/odletter/letter` | 紹介状などの保存/更新 | `LetterModule` を保存し PK を返却。【F:server-modernized/src/main/java/open/dolphin/rest/LetterResource.java†L38-L78】 |
| GET | `/odletter/list/{karteId}` | 文書一覧取得 | `LetterModuleList` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/LetterResource.java†L80-L112】 |
| GET | `/odletter/letter/{id}` | 文書詳細取得 | `LetterModuleConverter` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/LetterResource.java†L114-L134】 |
| DELETE | `/odletter/letter/{id}` | 文書削除 | `LetterServiceBean#delete` を呼び出し。監査ログ対応は別途実装予定。【F:server-modernized/src/main/java/open/dolphin/rest/LetterResource.java†L136-L144】 |

### StampResource (`/stamp`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/stamp/tree/{userPk}` | 個人スタンプツリー取得 | `StampServiceBean#getTrees` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L33-L52】 |
| PUT | `/stamp/tree` | 個人スタンプツリー保存 | バージョン衝突時は `RuntimeException` を投げる。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L54-L77】 |
| PUT | `/stamp/tree/sync` | 個人ツリー同期保存 | `pk,version` 文字列を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L79-L105】 |
| PUT | `/stamp/tree/forcesync` | 個人ツリー強制同期 | 衝突時も強制的に上書き。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L107-L126】 |
| PUT | `/stamp/published/tree` | 公開ツリー更新 | 公開カタログを更新し最新版を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L138-L164】 |
| PUT | `/stamp/published/cancel` | 公開ツリー取消 | 公開状態を解除しバージョンを返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L166-L187】 |
| GET | `/stamp/published/tree` | 公開ツリー一覧取得 | 施設 ID とグローバル共有を含む。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L189-L217】 |
| PUT | `/stamp/subscribed/tree` | サブスクライブ登録 | サブスク対象のツリー ID を登録。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L219-L249】 |
| DELETE | `/stamp/subscribed/tree/{idPks}` | サブスクライブ解除 | 解除件数を文字列で返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L251-L271】 |
| GET | `/stamp/id/{stampId}` | スタンプ単体取得 | `StampModelConverter` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L278-L291】 |
| GET | `/stamp/list/{stampIds}` | 複数スタンプ取得 | カンマ区切り ID を受け取り一覧を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L293-L313】 |
| PUT | `/stamp/id` | スタンプ保存/更新 | 単体スタンプを保存し ID を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L315-L335】 |
| PUT | `/stamp/list` | スタンプ一括保存 | `StampList` を受け取り保存 ID 群を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L337-L361】 |
| DELETE | `/stamp/id/{stampId}` | スタンプ削除 | 削除件数を返却。監査ログ強化予定。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L363-L374】 |
| DELETE | `/stamp/list/{stampIds}` | スタンプ一括削除 | 複数 ID を削除し件数を返却。【F:server-modernized/src/main/java/open/dolphin/rest/StampResource.java†L376-L391】 |

### ChartEventResource (`/chartEvent`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/chartEvent/subscribe` | 長輪講ポーリングでの購読 | レガシー互換のロングポーリング。【F:server-modernized/src/main/java/open/dolphin/rest/ChartEventResource.java†L48-L91】 |
| PUT | `/chartEvent/event` | チャートイベント送信 | `ChartEventServiceBean#processEvent`。【F:server-modernized/src/main/java/open/dolphin/rest/ChartEventResource.java†L110-L152】 |
| GET | `/chartEvent/dispatch` | 受診者単位のイベント配信 | 旧クライアント互換 API。【F:server-modernized/src/main/java/open/dolphin/rest/ChartEventResource.java†L133-L206】 |

### ChartEventStreamResource (`/chart-events`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/chart-events` | SSE 購読開始 | `clientUUID` と `Last-Event-ID` ヘッダーを検証し `ChartEventSseSupport` へ登録。【F:server-modernized/src/main/java/open/dolphin/rest/ChartEventStreamResource.java†L18-L48】 |

### MmlResource (`/mml`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/mml/document/{param}` | 施設カルテを MML 形式で出力 | `param` に施設 ID と期間を指定。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L27-L51】 |
| GET | `/mml/patient/{param}` | 患者病名を MML 出力 | JSON/MML 双方対応。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L52-L140】 |
| GET | `/mml/patient/list/{param}` | 対象患者一覧 MML 出力 | CSV 形式の ID 群を受け取る。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L80-L118】 |
| GET | `/mml/patient/json/{param}` | 患者 JSON 出力 | `IPatientModel` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L101-L140】 |
| GET | `/mml/disease/list/{param}` | 傷病名一覧 MML 出力 | `DiseaseHelper` を利用。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L116-L154】 |
| GET | `/mml/disease/json/{param}` | 傷病名 JSON 出力 | `RegisteredDiagnosisModelConverter`。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L137-L178】 |
| GET | `/mml/memo/list/{param}` | メモ一覧 MML 出力 | `PatientMemoServiceBean` 連携。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L152-L188】 |
| GET | `/mml/memo/json/{param}` | メモ JSON 出力 | `PatientMemoModelConverter`。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L171-L206】 |
| GET | `/mml/observation/list/{param}` | 観察値 MML 出力 | パラメータは CSV。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L188-L214】 |
| GET | `/mml/observation/json/{param}` | 観察値 JSON 出力 | `ObservationModelConverter` を返却。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L209-L244】 |
| GET | `/mml/karte/list/{param}` | カルテ文書一覧 MML | 添付含む長大レスポンスに注意。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L224-L260】 |
| GET | `/mml/karte/json/{param}` | カルテ文書 JSON | `KarteModel` を JSON で返却。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L262-L307】 |
| GET | `/mml/module/{param}` | モジュール取得 | `param` で種別と ID を指定。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L527-L607】 |
| GET | `/mml/interaction` | 服薬相互作用取得 | ORCA 連携データ。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L771-L846】 |
| GET | `/mml/stampTree/{param}` | スタンプツリー取得 | JSON 文字列を直接返却。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L847-L883】 |
| GET | `/mml/stamp/{param}` | スタンプ取得 | JSON 文字列を返却。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L882-L916】 |
| GET | `/mml/claim/conn` | CLAIM 接続設定取得 | `SystemServiceBean#getClaimConnectionType`。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L996-L1017】 |
| GET | `/mml/serverinfo` | サーバー情報取得 | `SystemServiceBean#getServerInfo` を JSON 返却。【F:server-modernized/src/main/java/open/dolphin/rest/MmlResource.java†L1009-L1030】 |

### NLabResource (`/lab`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/lab/module/{pid,first,max}` | ラボ検査履歴取得 | 分割取得パラメータを CSV で指定。【F:server-modernized/src/main/java/open/dolphin/rest/NLabResource.java†L35-L62】 |
| GET | `/lab/module/count/{pid}` | ラボ検査件数取得 | `nLabServiceBean#getLaboTestCount`。【F:server-modernized/src/main/java/open/dolphin/rest/NLabResource.java†L64-L84】 |
| GET | `/lab/item/{pid,first,max,itemCode}` | ラボ項目別履歴取得 | 項目コード指定。【F:server-modernized/src/main/java/open/dolphin/rest/NLabResource.java†L85-L116】 |
| GET | `/lab/patient/{pid1,pid2,...}` | ラボ検査対象患者取得 | CSV の患者 ID で絞り込み。【F:server-modernized/src/main/java/open/dolphin/rest/NLabResource.java†L117-L149】 |
| POST | `/lab/module` | ラボ検査結果登録 | 関連項目の親参照を再構築して保存。【F:server-modernized/src/main/java/open/dolphin/rest/NLabResource.java†L150-L188】 |
| DELETE | `/lab/module/{moduleId}` | ラボ検査削除 | `nLabServiceBean#deleteLabTest`。【F:server-modernized/src/main/java/open/dolphin/rest/NLabResource.java†L190-L199】 |

## 4. ORCA・外部連携

### OrcaResource (`/orca`)
主に ORCA マスタ・病名・スタンプ連携を担う大規模リソース。代表的なパスは以下の通り。

| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/orca/facilitycode` | ORCA 施設コード取得 | `OrcaServiceBean#getFacilityCode`。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L179-L214】 |
| GET | `/orca/tensu/shinku/{code}/` | 点数マスタ（新区）取得 | 末尾 `/` 付きパスを維持。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L261-L333】 |
| GET | `/orca/tensu/name/{keyword}/` | 名称検索 | 大文字小文字を区別しない部分一致。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L338-L422】 |
| GET | `/orca/tensu/code/{code}/` | 点数コード検索 | 完全一致検索。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L426-L510】 |
| GET | `/orca/tensu/ten/{ten}/` | 点数範囲検索 | `ten` 文字列を解析。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L502-L587】 |
| GET | `/orca/disease/name/{keyword}/` | 傷病名検索 | レガシー病名マスタを返却。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L594-L688】 |
| PUT | `/orca/interaction` | 服薬相互作用照会 | `OrcaServiceBean#getInteraction`。Legacy と同一リクエストボディを受け付け、結果は `DragInteractionListConverter` で返却する。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L709-L772】 |
| GET | `/orca/general/{code}` | 一般名マスタ取得 | `CodeNamePackConverter` を返却。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L774-L821】 |
| GET | `/orca/inputset` | 入力セット一覧取得 | `ModuleListConverter` を返却。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L824-L946】 |
| GET | `/orca/stamp/{id}` | ORCA スタンプ取得 | `ModuleListConverter`。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L948-L1113】 |
| GET | `/orca/disease/import/{pid}` | ORCA 傷病名取込 | ORCA 側病名を診療録形式に変換。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L1429-L1508】 |
| GET | `/orca/disease/active/{pid}` | ORCA 継続傷病名取得 | アクティブな病名のみ返却。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L1580-L1670】 |
| GET | `/orca/deptinfo` | 診療科情報一覧 | `OrcaServiceBean#getDeptInfo`。【F:server-modernized/src/main/java/open/orca/rest/OrcaResource.java†L1729-L1786】 |

※ 上記以外にも `/orca/tensu/point/` や `/orca/claim/` 系の補助エンドポイントが存在するため、要件変更時はソース全体を確認すること。

### PHRResource (`/20/adm/phr`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/20/adm/phr/accessKey/{accessKey}` | アクセスキーから PHRKey 取得 | 施設 ID を突合し、存在しない場合は TouchErrorResponse 付き 404。監査ログ `PHR_ACCESS_KEY_FETCH` を記録。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L104-L150】 |
| GET | `/20/adm/phr/patient/{patientId}` | 患者 ID から PHRKey 取得 | `PHRKey#dateToString` で日付整形後に返却。施設不一致は 403 と監査 `facility_mismatch`。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L152-L190】 |
| PUT | `/20/adm/phr/accessKey` | PHRKey 登録/更新 | JSON を `PHRKey` にバインドし、登録時は remote facility を強制。監査 `PHR_ACCESS_KEY_UPSERT` を出力。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L167-L204】 |
| GET | `/20/adm/phr/{facilityId,patientId,...}` | PHR データバンドル取得 | `PhrDataAssembler` で文書/検査を組み立てた `PHRContainer` を返却。`docSince`/`labSince`/SMS 返信先を含む。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L380-L438】 |
| GET | `/20/adm/phr/allergy/{patientId}` | アレルギー一覧テキスト出力 | `AllergyModel` を改行区切りで返却。監査 `PHR_ALLERGY_TEXT` を出力。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L206-L243】 |
| GET | `/20/adm/phr/disease/{patientId}` | 病名一覧テキスト出力 | 未登録時は固定メッセージを返却。監査 `PHR_DISEASE_TEXT`。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L244-L276】 |
| GET | `/20/adm/phr/medication/{patientId}` | 直近処方テキスト出力 | `ClaimBundle` を復元し数量/用法を整形。監査 `PHR_MEDICATION_TEXT`。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L278-L300】 |
| GET | `/20/adm/phr/labtest/{patientId}` | 直近検査結果テキスト出力 | 検体日付を `normalizeSampleDate2` で整形。監査 `PHR_LABTEST_TEXT`。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L302-L323】 |
| GET | `/20/adm/phr/abnormal/{patientId}` | 異常値テキスト出力 | 異常項目が無い場合は「異常値はありません。」を返却。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L325-L347】 |
| GET | `/20/adm/phr/image/{patientId}` | PHR 画像取得 | `SchemaModel#getJpegByte` をストリーム転送し、存在しなければ 404。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L348-L379】 |
| POST | `/20/adm/phr/identityToken` | Layer ID トークン発行 | `IdentityService#getIdentityToken` 呼び出し結果を返却し失敗時は TouchErrorResponse を使用。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L439-L460】 |
| POST | `/20/adm/phr/export` | PHR データ非同期出力ジョブ作成 | `PhrExportJobManager#submit` でジョブ作成・監査 `PHR_EXPORT_REQUEST` を記録。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L462-L501】 |
| GET | `/20/adm/phr/status/{jobId}` | PHR ジョブ状態取得 | `PHRAsyncJob` を参照し、完了時は署名付き `downloadUrl` を生成。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L503-L526】 |
| DELETE | `/20/adm/phr/status/{jobId}` | PHR ジョブ取消 | `PHRAsyncJobServiceBean#cancel` で PENDING ジョブを `CANCELLED` へ遷移。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L528-L565】 |
| GET | `/20/adm/phr/export/{jobId}/artifact` | 成果物ダウンロード | HMAC 署名を検証しファイルシステムから ZIP をストリーム配信。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java†L567-L626】 |

> 非同期エクスポート系エンドポイント（`POST /20/adm/phr/export`、`GET /20/adm/phr/status/{jobId}` など）は現時点で実装が存在しない。`PhrExportJobManager` や `PHRAsyncJobServiceBean` は用意されているが、REST エンドポイント・ジョブワーカーが未実装なため運用不可。

## 5. 管理・受付バックエンド (ADM10/ADM20)

### AdmissionResource (`/20/adm`)
2FA・入院管理などの業務 API。主要エンドポイントは以下。

| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/20/adm/carePlan/{param}` | ケアプラン取得 | `patientPK` から最新ケアプラン一覧を返す。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L132-L154】 |
| POST | `/20/adm/carePlan` | ケアプラン登録 | JSON で受け取り `CarePlanModel` を永続化。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L156-L174】 |
| PUT | `/20/adm/carePlan` | ケアプラン更新 | 該当レコードを更新し件数を返す。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L176-L194】 |
| DELETE | `/20/adm/carePlan` | ケアプラン削除 | 対象ケアプランを削除し削除件数を返す。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L197-L215】 |
| GET | `/20/adm/lastDateCount/{param}` | 来院履歴要約取得 | `fid,pid` を基に最終受診などを検索。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L217-L237】 |
| GET | `/20/adm/docid/{param}` | ドキュメント ID 一覧取得 | CSV のパラメータでフィルタ。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L134-L186】 |
| GET | `/20/adm/document/{param}` | ドキュメント取得 | `AdmissionServiceBean#getDocument`。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L188-L243】 |
| POST | `/20/adm/sendPackage` | カルテ送信 | 受付パッケージをまとめて送信。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L178-L214】 |
| PUT | `/20/adm/factor2/device` | 2FA デバイス紐付け更新 | 新端末登録を処理。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L268-L330】 |
| PUT | `/20/adm/factor2/code` | SMS 認証コード再送 | 5 リクエスト/分でレート制限予定。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L332-L390】 |
| DELETE | `/20/adm/factor2/auth/{param}` | 2FA 認証状態リセット | 端末紐付けを解除。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L392-L436】 |
| POST | `/20/adm/factor2/totp/registration` | TOTP 登録開始 | シークレットと `otpauth://` URI を返す。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L720-L742】 |
| POST | `/20/adm/factor2/totp/verification` | TOTP 登録完了 | バックアップコード生成と検証。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L744-L769】 |
| POST | `/20/adm/factor2/fido2/registration/options` | FIDO2 登録チャレンジ開始 | WebAuthn `PublicKeyCredentialCreationOptions` を返す。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L780-L804】 |
| POST | `/20/adm/factor2/fido2/registration/finish` | FIDO2 登録完了 | 認証器を `Factor2Credential` に登録。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L806-L829】 |
| POST | `/20/adm/factor2/fido2/assertion/options` | FIDO2 認証チャレンジ開始 | Challenge を生成し返却。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L834-L854】 |
| POST | `/20/adm/factor2/fido2/assertion/finish` | FIDO2 認証完了 | 署名検証と監査ログを実施。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L860-L880】 |
| PUT | `/20/adm/user/factor2/device` | 2FA 端末認証 | SMS コードで新端末を信頼済みに登録。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L689-L704】 |
| PUT | `/20/adm/user/factor2/backup` | バックアップコード解除 | ハッシュ化したバックアップコードを検証。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L705-L719】 |
| POST | `/20/adm/nurseProgressCourse` | 看護経過記録保存 | PUT/DELETE/GET も同リソースで提供。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L438-L572】 |
| GET | `/20/adm/nurseProgressCourse/{param}` | 看護経過記録取得 | 指定期間の看護記録を返す。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L438-L509】 |
| POST | `/20/adm/ondoban` | 温度板記録保存 | GET/PUT/DELETE あり。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L574-L736】 |
| PUT | `/20/adm/sms/message` | SMS メッセージ送信 | `SmsServiceBean#send`。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L738-L796】 |

### JsonTouchResource (ADM10/ADM20)
- `/10/adm/jtouch` および `/20/adm/jtouch` ベースで、JSON 化された受付・カルテパッケージを扱う。
- 主な機能: ユーザー情報取得、患者検索（氏名/ID）、受付パッケージ取得、スタンプツリー/スタンプ取得、モジュール収集、薬剤相互作用照会など。【F:server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java†L69-L488】【F:server-modernized/src/main/java/open/dolphin/adm20/rest/JsonTouchResource.java†L78-L512】

### EHTResource (`/10/eht`, `/20/adm/eht`)
- 電子問診・タブレット連携向け API。来院者一覧、仮保存カルテ、患者メモ、診断、バイタル、身体所見の取得・更新を提供。【F:server-modernized/src/main/java/open/dolphin/touch/EHTResource.java†L100-L1404】【F:server-modernized/src/main/java/open/dolphin/adm20/rest/EHTResource.java†L75-L972】

## 6. タッチクライアント連携 (`/touch`, `/demo`)

### DolphinResource / DolphinResourceASP (`/touch`)
- スマートデバイス向けカルテビューア。カルテ文書・患者情報・検査結果・スタンプツリー取得、`POST /touch/idocument` / `/touch/idocument2` によるカルテ登録を提供。【F:server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java†L24-L428】【F:server-modernized/src/main/java/open/dolphin/touch/DolphinResourceASP.java†L24-L1436】

### DemoResource / DemoResourceASP (`/demo`)
- デモモード用エンドポイント。`GET /demo/patient/{pk}` や `GET /demo/module/{param}` など、`/touch` 相当の読み取り専用 API を提供。【F:server-modernized/src/main/java/open/dolphin/touch/DemoResource.java†L24-L347】【F:server-modernized/src/main/java/open/dolphin/touch/DemoResourceASP.java†L24-L1440】

### JsonTouchResource (`/touch/jtouch`)
- `/touch/jtouch` 系は JSON ベースの軽量 API として患者検索、受付パッケージ取得、スタンプ取得などを提供。【F:server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java†L69-L488】

### TouchPatientResource / TouchStampResource / TouchUserResource (`/touch/*`)
- `/touch/patient` 系エンドポイントを `TouchPatientResource` と `TouchPatientService` に分離し、施設整合チェック・`X-Access-Reason`／`X-Consent-Token` ヘッダー必須化・`AuditTrailService` 連携を実装。レスポンスは `IPatientModel`/DTO ベースの JSON へ正規化。【F:server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java†L13-L66】【F:server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientService.java†L25-L190】
- `GET /touch/patient/{patientPk}/firstEncounter`（新設想定）で Touch 初診データを取得。`docType` クエリ（任意）を指定すると `FirstEncounterModel.docType` でフィルタされ、`FirstEncounter0Model` / `FirstEncounter1Model` / `FirstEncounter2Model` など Legacy サブタイプを判別できる。未指定時は施設カルテ ID ごとに `recorded desc` で全件返却。レスポンスは `FirstEncounterModel` の `beanBytes` と `docType` を含むリストで、クライアント側で `IOSHelper.xmlDecode` により既存フォーマットへ復元する想定。
- `/touch/stamp`／`/touch/stampTree` は `TouchStampResource`＋`TouchStampService` が応答し、`TouchResponseCache`（TTL 10 秒）でスタンプ取得をキャッシュ。監査イベントは `TOUCH_STAMP_FETCH`／`TOUCH_STAMP_TREE_FETCH` へ統一。【F:server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampResource.java†L13-L45】【F:server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampService.java†L20-L69】
- `/touch/user/{param}` は `TouchUserResource` へ移行し、`userName/password` ヘッダー検証・施設 ID 正規化・S3 Secret マスクを実施。監査は `TOUCH_USER_LOOKUP` に統一。【F:server-modernized/src/main/java/open/dolphin/touch/user/TouchUserResource.java†L13-L34】【F:server-modernized/src/main/java/open/dolphin/touch/user/TouchUserService.java†L24-L154】
- ユニットテスト: `TouchPatientServiceTest`・`TouchStampServiceTest`・`TouchUserServiceTest` で consent／キャッシュ／ヘッダー突合を自動化（いずれも Maven 未導入環境のため CI 実行待ち）。【F:server-modernized/src/test/java/open/dolphin/touch/patient/TouchPatientServiceTest.java†L1-L112】【F:server-modernized/src/test/java/open/dolphin/touch/stamp/TouchStampServiceTest.java†L1-L73】【F:server-modernized/src/test/java/open/dolphin/touch/user/TouchUserServiceTest.java†L1-L110】

## 7. ORCA API ラッパー整備状況（Matrix No.6-18, 33-37）

`docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` および `phase2/operations/assets/orca-api-spec/orca-api-matrix.with-spec.csv` と突き合わせた、ORCA API ラッパーの最新状況。`GET /orca/disease/{import|active}` を除き、ここに記載した API は現状モダナイズ版サーバーに REST ラッパーが存在しない。

| No | 優先度 | ORCA API | モダナイズ REST | 状況 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 6 | P0 | `/api01rv2/appointlstv2` | なし | 未実装 | 日別予約一覧。`OrcaResource` に `/orca/appoint*` が無いため予約ウィジェットは ORCA 直呼び。Phase2 Sprint2 で `POST /orca/appointments/list` を追加予定（API_PARITY_MATRIX.md「ORCA ラッパー計画」参照）。 |
| 7 | P1 | `/orca102/medicatonmodv2` | なし | 未実装 | 点数マスタ同期 API。既存 REST は `GET /orca/tensu/*` のみ。Phase2 Sprint3 で POST ラッパー＋ MasterImport を再構成予定。 |
| 8 | P0 | `/api01rv2/patientlst1v2` | なし | 未実装 | 患者番号一括取得。`PatientResource` は単件検索のみで、差分同期は ORCA API 直呼び。 |
| 9 | P0 | `/api01rv2/patientlst2v2` | なし | 未実装 | 複数患者情報取得。同上でバッチ用 REST が無い。 |
| 10 | P0 | `/api01rv2/patientlst3v2` | なし | 未実装 | 氏名検索。Web クライアントの仮名検索要件は現状 ORCA API 直叩き。 |
| 11 | P1 | `/api01rv2/system01lstv2` | なし | 未実装 | システム管理情報。`ServerInfoResource` は施設・CLAIM 設定のみで職員/診療科一覧を返せない。 |
| 12 | P0 | `/api01rv2/medicalgetv2` | なし | 未実装 | 診療行為取得。カルテ API はモダナイズ DB のみ参照。 |
| 13 | P0 | `/api01rv2/diseasegetv2` | `GET /orca/disease/import/{pid}` | 部分実装 | import/active GET は存在するが、`Api_Result` など ORCA プロトコル項目を返さない。Phase2 Sprint2 でレスポンス整形と RUN_ID 証跡を追加。 |
| 14 | P0 | `/orca12/patientmodv2` | なし | 未実装 | 患者登録/更新/削除。モダナイズ DB 更新にしかフックが無い。 |
| 15 | P0 | `/api01rv2/appointlst2v2` | なし | 未実装 | 患者単位予約一覧。AppoResource は自院 DB のみ参照。 |
| 16 | P0 | `/api01rv2/acsimulatev2` | なし | 未実装 | 請求試算。`ClaimSender` での請求送信とは別経路。 |
| 17 | P0 | `/orca25/subjectivesv2` | なし | 未実装 | 症状詳記（SOAP 詳細）登録。 |
| 18 | P0 | `/api01rv2/visitptlstv2` | なし | 未実装 | 来院患者一覧。 |
| 33 | P0 | `/orca21/medicalsetv2` | なし | 未実装 | 診療セット登録。`GET /orca/inputset` のみ提供中。 |
| 34 | P1 | `/orca31/birthdeliveryv2` | なし | 未実装 | 出産育児一時金連携。 |
| 35 | P0 | `/api01rv2/patientlst6v2` | なし | 未実装 | 全保険組合せ返却。 |
| 36 | P0 | `/orca22/diseasev2` | なし | 未実装 | 病名登録 v2。 |
| 37 | P0 | `/orca22/diseasev3` | なし | 未実装 | 病名登録 v3。 |

> **メモ**: 各 API の DTO・依存サービス・リリースターゲットは `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` の「ORCA ラッパー計画」節に詳細を記載する。

## 8. リアルタイム配信とモダナイズ特有の注意点

- SSE によるチャートイベント配信は `GET /chart-events` で開始し、`clientUUID` と `Last-Event-ID` をヘッダーで指定する。サーバーは `ChartEventSseSupport` を通じて再接続時の差分配送を行う。【F:server-modernized/src/main/java/open/dolphin/rest/ChartEventStreamResource.java†L18-L48】
- 旧ロングポーリング API (`/chartEvent/subscribe` と `/chartEvent/dispatch`) は互換性維持のため残置されており、将来的に段階的廃止予定。新旧クライアントが混在する期間は SSE と REST の双方を監視する。
- 2FA や SMS 認証エンドポイントは ADM20 配下で Jakarta API へ移行済みだが、レート制限・監査ログは今後のマイクロプロファイル連携が前提。運用導入時は API Gateway 側での制御を忘れないこと。【F:server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java†L332-L436】

---

**更新手順メモ**
1. 新規エンドポイントを追加した際は、本インベントリと `server-api-inventory.yaml` の双方を更新する。
2. SSE/リアルタイム関連を変更する場合は `ChartEventStreamResource` と `ChartEventResource` の両方の挙動を検証し、Web クライアント向け通知仕様書も併せて改訂する。
