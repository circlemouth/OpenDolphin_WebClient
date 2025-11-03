# 旧サーバー REST API インベントリ

- 作成日: 2026-XX-XX
- 対象: `server/src/main/java/open/dolphin/rest` および `server/src/main/java/open/orca/rest` に実装されている Jakarta EE (Java EE) ベースの旧サーバー API。
- 前提: すべての業務 API は `userName` / `password(MD5)` / `clientUUID` ヘッダーを要求し、施設 ID は WildFly の `RemoteUser` から解決される。レスポンスは JSON（Jackson 1.x）またはテキスト/バイナリで返却される。
- 注意: ここに記載したエンドポイントは現行 Swing クライアントおよび Web クライアント (モダナイズ前) が利用するレガシー API であり、互換維持のため削除禁止。実装を更新する場合は各サービス Bean のトランザクション境界と監査ログ要件を再確認すること。

## 1. 認証・施設・システム情報

### UserResource (`/user`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/user/{userId}` | ログインユーザー本人の情報取得 | `userName` ヘッダーと `userId` が一致しない場合は `null` を返却。施設情報を含む。 |
| GET | `/user` | 施設所属ユーザー一覧取得 | 管理者権限チェックあり。`UserListConverter` で返却。 |
| POST | `/user` | ユーザー新規登録 | 管理者のみ許可。`roles` に対して親参照を再構築して保存。 |
| PUT | `/user` | ユーザー情報更新 | 管理者、または本人による一部更新。権限昇格は追加チェックあり。 |
| DELETE | `/user/{userId}` | ユーザー削除 | 管理者のみ。戻り値なし。 |
| PUT | `/user/facility` | 施設情報更新 | 登録済み施設属性を更新。 |
| GET | `/user/name/{userId}` | ユーザー表示名取得 | 認証ヘッダーのみで利用可能。 |

### SystemResource (`/dolphin`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/dolphin` | 疎通確認メッセージを返却 | `"Hellow, Dolphin"` を返却する簡易ヘルスチェック。 |
| POST | `/dolphin` | 施設管理者アカウントの一括登録 | 登録結果は `facilityId:userId` 形式の文字列。 |
| GET | `/dolphin/activity/{year,month,count}` | 月次活動ログの集計 | `ActivityModel` の配列（`count` 過去月 + total）を返却。施設 ID は `RemoteUser` から取得。 |
| POST | `/dolphin/license` | Cloud Zero 向けライセンス登録/検証 | ライセンスファイルを更新。戻り値 `0`=成功、`2`〜`4`=エラー。 |
| GET | `/dolphin/cloudzero/sendmail` | 月次 CloudZero メール送信 | ライセンス管理ログ出力のみ。戻り値なし。 |

### ServerInfoResource (`/serverinfo`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/serverinfo/jamri` | JMARI コード取得 | `custom.properties` から読み込み。 |
| GET | `/serverinfo/claim/conn` | CLAIM 接続モード取得 | クライアント/サーバーモードを返却。 |
| GET | `/serverinfo/cloud/zero` | Cloud Zero 用設定取得 | `cloud.zero` プロパティ値を返却。 |

## 2. 患者・受付・スケジュール

### PatientResource (`/patient`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/patient/name/{name}` | 氏名検索 | 完全一致/部分一致。結果は施設内患者のみ。 |
| GET | `/patient/kana/{kana}` | カナ検索 | 全角カナを想定。 |
| GET | `/patient/digit/{digit}` | 生年月日/電話番号検索 | 数字検索。 |
| GET | `/patient/id/{pid}` | 患者 ID 検索 | 単一患者を返却。 |
| GET | `/patient/pvt/{yyyymmdd}` | 日次来院患者取得 | 受付日付でフィルタ。 |
| GET | `/patient/documents/status` | 仮保存カルテ保有患者 | `PatientServiceBean#getTmpKarte` を呼び出す。 |
| GET | `/patient/count/{query}` | 検索件数確認 | 1000 件超過時の件数確認用。 |
| GET | `/patient/all` | 施設内患者全件取得 | 大量応答に注意。 |
| GET | `/patient/custom/{query}` | カスタム条件検索（傷病名など） | `PatientServiceBean#getCustom` に委譲。 |
| POST | `/patient` | 患者登録 | JSON (`PatientModel`) を保存し PK を返却。 |
| PUT | `/patient` | 患者更新 | JSON (`PatientModel`) を更新し件数を返却。 |

### PVTResource (`/pvt`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/pvt/{params}` | 受付一覧取得 | `params` は `did,unassigned,pvtDate,firstResult,appoDateFrom,appoDateTo` または日付のみ。 |
| POST | `/pvt` | 受付登録 | 保険情報の親参照を再構築して保存。 |
| PUT | `/pvt/{pvtPK,state}` | 受付ステータス更新 | `state` を数値で指定。戻り値は更新件数。 |
| PUT | `/pvt/memo/{pvtPK,memo}` | 受付メモ更新 | メモはカンマ区切りエンコードに注意。 |
| DELETE | `/pvt/{pvtPK}` | 受付削除 | 戻り値なし。 |

### PVTResource2 (`/pvt2`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| POST | `/pvt2` | 受付登録 (拡張版) | Jackson で `PatientVisitModel` を復元し、施設 ID を上書き。 |
| DELETE | `/pvt2/{pvtPK}` | 受付削除 | 施設 ID で権限チェック後に削除。 |
| GET | `/pvt2/pvtList` | 長輪講購読者向け受付一覧 | `ChartEventServiceBean#getPvtList` を使用。 |

### ScheduleResource (`/schedule`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/schedule/pvt/{params}` | 予約/受付一覧取得 | `params` は `pvtDate` または `did,unassigned,pvtDate`。 |
| POST | `/schedule/document` | 予定カルテ作成 + CLAIM 送信 | `PostSchedule` JSON を受け取り、必要に応じて請求送信。 |
| DELETE | `/schedule/pvt/{pvtPK,ptPK,yyyy-MM-dd}` | 予約削除 | 日付文字列は `yyyy-MM-dd`。 |

### AppoResource (`/appo`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| PUT | `/appo` | 予約一覧更新 | `AppoList` JSON を受信し、一括更新件数を返却。 |

## 3. カルテ・診療記録

### KarteResource (`/karte`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/karte/pid/{pid,from}` | 患者 ID 指定でカルテ取得 | `from` は `yyyy-MM-dd`。施設 ID でフィルタ。 |
| GET | `/karte/{patientPk,from}` | 患者 PK 指定でカルテ取得 | 施設 ID フィルタなし。 |
| GET | `/karte/docinfo/{karteId,from,includeModified}` | 文書メタ情報一覧 | `includeModified` は `true/false`。 |
| GET | `/karte/documents/{docIds}` | 複数文書の詳細取得 | 添付バイナリは `null` に差し替え。 |
| POST | `/karte/document` | 新規カルテ保存 | モジュール/シェーマ/添付の親参照を再構築。 |
| POST | `/karte/document/pvt/{pvtPK[,state]}` | 受付紐付け保存 | 保存後に受付ステータスを更新。 |
| PUT | `/karte/document/{id}` | 文書タイトル更新 | 本文ではなくタイトルのみ変更。 |
| DELETE | `/karte/document/{id}` | 文書削除 | 削除済み文書 ID を `StringList` で返却。 |
| GET | `/karte/modules/{karteId,entity,from,to,...}` | モジュール履歴取得 | `from`/`to` をペアで複数指定。 |
| GET | `/karte/iamges/{karteId,from,to,...}` | 画像メタ情報を Plist で取得 | パス綴りは `iamges` のまま。戻り値は XML。 |
| GET | `/karte/image/{id}` | 単一画像取得 | `SchemaModelConverter` を返却。 |
| GET | `/karte/diagnosis/{karteId,from[,activeOnly]}` | 病名一覧取得 | `activeOnly` 省略可。 |
| POST | `/karte/diagnosis/claim` | 病名登録/更新＋CLAIM送信 | 結果はカンマ区切り ID。 |
| POST | `/karte/diagnosis` | 病名新規登録 | 追加した病名 ID 群を返却。 |
| PUT | `/karte/diagnosis` | 病名更新 | 更新件数を返却。 |
| DELETE | `/karte/diagnosis/{ids}` | 病名削除 | カンマ区切り ID。 |
| GET | `/karte/observations/{karteId,observation,phenomenon[,date]}` | 観察値取得 | `date` で起点を指定可能。 |
| POST | `/karte/observations` | 観察値登録 | 追加 ID をカンマ区切りで返却。 |
| PUT | `/karte/observations` | 観察値更新 | 更新件数を返却。 |
| DELETE | `/karte/observations/{ids}` | 観察値削除 | カンマ区切り ID。 |
| PUT | `/karte/memo` | 患者メモ更新 | `PatientMemoModel` を受信。 |
| GET | `/karte/freedocument/{patientId}` | フリードキュメント取得 | `facilityPatId` を施設 ID 付きで解決。 |
| PUT | `/karte/freedocument` | フリードキュメント更新 | `facilityPatId` を上書きして保存。 |
| GET | `/karte/appo/{karteId,from,to,...}` | 予約履歴取得 | `from`/`to` ペアで複数期間指定。 |
| PUT | `/karte/claim` | CLAIM 送信 | 送信成功で "1"、失敗時 "0"。 |
| GET | `/karte/moduleSearch/{karteId,from,to,entity...}` | Entity 単位モジュール検索 | 施設 ID と日付範囲でフィルタ。 |
| GET | `/karte/docinfo/all/{karteId}` | 全文書取得 | 添付バイナリは `null`。大容量に注意。 |
| GET | `/karte/attachment/{id}` | 添付ファイル取得 | `AttachmentModel` を JSON で返却。 |

### LetterResource (`/odletter`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| PUT | `/odletter/letter` | 紹介状などの保存/更新 | `LetterModule` を保存し PK を返却。 |
| GET | `/odletter/list/{karteId}` | 文書一覧取得 | `LetterModuleList` を返却。 |
| GET | `/odletter/letter/{id}` | 文書取得 | 単一 `LetterModule`。 |
| DELETE | `/odletter/letter/{id}` | 文書削除 | 戻り値なし。 |

### ChartEventResource (`/chartEvent`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/chartEvent/subscribe` | 長輪講 (Comet) 受付 | Servlet 非同期コンテキストを開始。 |
| PUT | `/chartEvent/event` | イベント受信・配送 | JSON (`ChartEventModel`) を受信。戻り値は処理件数。 |
| GET | `/chartEvent/dispatch` | サーバー側のイベント取得 | Async コンテキストに保存されたイベントを返却。 |

## 4. ラボ・帳票・MML

### NLabResource (`/lab`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/lab/module/{pid,first,max}` | ラボモジュール取得 | `PatientVisitListConverter` ではなく `NLaboModuleListConverter` を返却。 |
| GET | `/lab/module/count/{pid}` | ラボモジュール件数 | 文字列で件数を返却。 |
| GET | `/lab/item/{pid,first,max,itemCode}` | ラボ項目履歴取得 | 指定検査項目の履歴を返却。 |
| GET | `/lab/patient/{ids}` | ラボ制約患者一覧 | カンマ区切り ID を配列化。 |
| POST | `/lab/module` | ラボ結果登録 | 添付項目へ親参照を設定して保存。患者情報を返却。 |
| DELETE | `/lab/module/{moduleId}` | ラボ結果削除 | 戻り値なし。 |

### MmlResource (`/mml`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/mml/document/{facilityId}` | 施設文書の MML 変換 | 非同期で MML ダンプを実行。戻り値は対象件数。 |
| GET | `/mml/patient/{facilityId}` | 施設患者病名を MML 変換 | 非同期処理。戻り値は対象件数。 |
| GET | `/mml/patient/list/{facilityId}` | 患者 PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/patient/json/{pk}` | 患者 JSON 取得 | `IPatientModel`。 |
| GET | `/mml/disease/list/{facilityId}` | 病名 PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/disease/json/{pk}` | 病名 JSON 取得 | `RegisteredDiagnosisModelConverter`。 |
| GET | `/mml/memo/list/{facilityId}` | 患者メモ PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/memo/json/{pk}` | 患者メモ JSON 取得 | `PatientMemoModelConverter`。 |
| GET | `/mml/observation/list/{facilityId}` | 観察値 PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/observation/json/{pk}` | 観察値 JSON 取得 | `ObservationModelConverter`。 |
| GET | `/mml/karte/list/{facilityId}` | カルテ PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/karte/json/{pk}` | カルテ JSON 取得 | `DocumentModelConverter`。 |
| GET | `/mml/letter/list/{facilityId}` | 紹介状 PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/letter/json/{pk}` | 紹介状 JSON 取得 | `LetterModuleConverter`。 |
| GET | `/mml/labtest/list/{facilityId}` | ラボモジュール PK 一覧取得 | カンマ区切り文字列。 |
| GET | `/mml/labtest/json/{pk}` | ラボモジュール JSON 取得 | `NLaboModuleConverter`。 |

## 5. スタンプ・テンプレート

### StampResource (`/stamp`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/stamp/tree/{userPK}` | 個人スタンプツリー取得 | `StampTreeHolderConverter`。 |
| PUT | `/stamp/tree` | 個人ツリー保存 | `StampTreeModel` を保存し PK を返却。 |
| PUT | `/stamp/tree/sync` | ツリー差分同期 | バージョン情報を返却。 |
| PUT | `/stamp/tree/forcesync` | 強制同期 | 戻り値なし。 |
| PUT | `/stamp/published/tree` | 公開ツリー更新 | バージョン文字列を返却。 |
| PUT | `/stamp/published/cancel` | 公開ツリー取消 | 取消後バージョンを返却。 |
| GET | `/stamp/published/tree` | 公開ツリー一覧 | 施設ごとの公開スタンプ。 |
| PUT | `/stamp/subscribed/tree` | 公開ツリー購読 | 購読した ID をカンマ区切りで返却。 |
| DELETE | `/stamp/subscribed/tree/{ids}` | 公開ツリー購読解除 | 戻り値なし。 |
| GET | `/stamp/id/{uuid}` | スタンプ取得 | 単一 `StampModel`。 |
| GET | `/stamp/list/{ids}` | スタンプ複数取得 | カンマ区切り UUID 指定。 |
| PUT | `/stamp/id` | スタンプ保存 | 保存済み UUID を返却。 |
| PUT | `/stamp/list` | スタンプ複数保存 | 返却はカンマ区切り UUID。 |
| DELETE | `/stamp/id/{uuid}` | スタンプ削除 | 戻り値なし。 |
| DELETE | `/stamp/list/{ids}` | スタンプ複数削除 | 戻り値なし。 |

## 6. ORCA 連携 (`open.orca.rest.OrcaResource`)
| HTTP | パス | 主な処理 | 備考 |
| --- | --- | --- | --- |
| GET | `/orca/facilitycode` | ORCA 側の施設コード/JMARI 取得 | `custom.properties` の値を優先。 |
| GET | `/orca/tensu/shinku/{code}/` | 診療行為区分検索 | 区分パターン (`srysyukbn`) を指定。 |
| GET | `/orca/tensu/name/{query}/` | 点数名称検索 | 名称・カナを部分一致。日付パラメータ同梱。 |
| GET | `/orca/tensu/code/{query}/` | 点数コード検索 | 正規表現検索。 |
| GET | `/orca/tensu/ten/{range}/` | 点数値検索 | 上限下限または単一値でフィルタ。 |
| GET | `/orca/disease/name/{query}/` | 病名マスター検索 | DB バージョンに合わせて項目を返却。 |
| PUT | `/orca/interaction` | 併用禁忌チェック | 薬剤コードペアを JSON で送信。 |
| GET | `/orca/general/{srycd}` | 一般名取得 | `CodeNamePackConverter` を返却。 |
| GET | `/orca/inputset` | ORCA 入力セット一覧 | 施設設定を含む。 |
| GET | `/orca/stamp/{param}` | 入力セット展開 | `ModuleListConverter` を返却。 |
| GET | `/orca/disease/import/{pid,from,to}` | 過去病名取り込み | 期間指定。 |
| GET | `/orca/disease/active/{pid,ascend}` | 現在病名取得 | `ascend` に `true/false`。 |
| GET | `/orca/deptinfo` | 診療科情報取得 | `DeptInfoList` を返却。 |

## 7. 監査・運用時の注意
- API 追加・変更時は、本インベントリと `docs/web-client/architecture/REST_API_INVENTORY.md` の両方を更新すること。
- 監査ログ (`open.dolphin.audit.*`) と CLAIM 連携が絡むエンドポイントでは、既存のログ出力とトランザクション境界を崩さない。
- CloudZero ライセンス関連や ORCA 連携は外部ファイル（`custom.properties`, `license.properties`）を参照するため、テスト環境構築時はダミー値を投入する。
