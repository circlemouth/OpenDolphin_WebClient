# オーダー入力データ要件ガイド

本ガイドは Web クライアントがサーバーへカルテ文書を登録する際に、**すべてのオーダカテゴリ**（処方・注射・処置・手術・検体検査・放射線など）および関連文書メタデータについて入力すべき情報を網羅的に整理したものです。サーバー側の `DocumentModel`／`ModuleModel` およびオーダ別スタンプ (`BundleMed` など) が期待する項目をすべて満たすよう、以下の要件を遵守してください。

## 1. 文書全体で共通に必要となる情報

- **文書エントリ共通情報**: `DocumentModel` は `KarteEntryBean` を継承しているため、以下の値を必須で設定する。
  - 記録状態: `status`、`confirmed`（確定日時）、`started`（診療開始）、`recorded`（記録日時）。
  - 記録者: `creator`（ユーザー GUID）、`karte`（カルテ GUID）。
  - 連携情報: `linkId`（親文書 GUID）と `linkRelation`（関係種別）。親版がない場合は null を明示する。
- **文書メタ情報 (`DocInfoModel`)**:
  - `docId`（32 文字 GUID）、`docType`（例: `karte`）、`title`、`purpose` を必須で入力する。
  - 診療科 (`department`／`departmentDesc`)、担当医（`departmentDesc` に含まれる担当者情報を含める）、保険 (`healthInsurance`／`healthInsuranceDesc`) を揃える。
  - 文書内容に応じたフラグを更新する（`hasRp`、`hasTreatment`、`hasLaboTest`、`hasImage`、`hasMark`）。注射・手術なども該当する場合は `hasTreatment` を真にする。
  - CLAIM／検体検査連携情報を揃える：`sendClaim`、`claimDate`、`labtestOrderNumber`、`sendLabtest`、`pVTHealthInsuranceModel`（保険適用情報）、処方せん関連フィールド（`issuanceDate`、`InstitutionNumber` など）。
  - 外来／入院区分 (`admFlag`) や保険医療機関番号など、請求や帳票で使用される付帯情報も確実にセットする。
- **モジュールコレクション**: 文書に含める `ModuleModel`、`SchemaModel`、`AttachmentModel` の一覧を完全に準備し、`KarteServiceBean#addDocument` が正しい親参照を設定できるようにする。不要な空配列は送信しない。

## 2. モジュール共通メタデータ

- `ModuleModel` も `KarteEntryBean` を継承するため、文書側と同様に `status`、`confirmed`、`started`、`recorded`、`creator`、`karte` を必ず保持する。
- スタンプ本体は直列化済みバイト列として `beanBytes`（`@Lob`, `nullable=false`）へ格納する。欠落すると永続化に失敗する。
- `ModuleInfoBean`（埋め込みオブジェクト）では次の項目を必須入力とする。
  - `name`: スタンプ名（文書表示用）。
  - `role`: SOAP/SOA/P などの配置ロール。
  - `entity`: オーダ種別識別子。`IInfoModel.STAMP_ENTITIES` に列挙される `medOrder`／`injectionOrder`／`treatmentOrder`／`surgeryOrder`／`testOrder`／`physiologyOrder`／`bacteriaOrder`／`radiologyOrder`／`baseChargeOrder`／`instractionChargeOrder`／`otherOrder`／`generalOrder` などから適切に選択する。
  - `stampNumber`: 文書内での表示順序。
- その他、`stampId`（スタンプ GUID）、`memo`、`confirmed` フラグ等を必要に応じて設定し、閲覧・検索機能で齟齬が出ないよう維持する。
- `ModuleInfoBean.entity` と `BundleDolphin.orderName` は ORCA 点数コードから導かれるカテゴリに一致させる。`/orca/stamp/{code}` や `/orca/inputset` を利用した場合はレスポンスで提供される `entity` を尊重する。

## 3. スタンプ（ClaimBundle/BundleDolphin）共通フィールド

- **診療行為定義 (`ClaimBundle` 共通)**
  - `className`／`classCode`／`classCodeSystem`: 主診療行為名と点数コード。`OrcaResource#getEntityOrderName` により 110–899 の点数範囲でオーダカテゴリが判定されるため、コードは正確に設定する。
  - `bundleNumber`: 実施回数または投与日数。予定カルテでは確定前でも暫定値を入れておく。
  - 用法関連 (`admin`、`adminCode`、`adminCodeSystem`、`adminMemo`): 注射や処方以外でも経路・実施条件の補足が必要な場合は活用する。
  - `insurance`: 適用保険区分。保険切替時は文書全体の保険情報と矛盾しないようにする。
  - `memo`: 医師メモや患者指示など自由記述を格納する。
- **構成アイテム (`ClaimItem[]`)**
  - 最低 1 件の `ClaimItem` を登録し、各アイテムに `name`、`code`、`codeSystem`、`classCode`、`classCodeSystem`、`number`、`unit`、`numberCode`、`numberCodeSystem`、`memo`、`ykzKbn`（薬剤区分が判明している場合）を設定する。
  - 検査・指導関連では ORCA から返却される `suryo1`／`suryo2`、`startDate`／`endDate`、`sstKijunCdSet` があるため、該当項目を保持して再送信時に失われないようにする。
  - `ClaimItem` 数量は文字列扱いのため、「1」「1.0」などサーバーが期待する形式を維持する。

## 4. オーダカテゴリ別の追加要件

### 4.1 薬剤処方オーダ (`entity = medOrder`)

- **スタンプ本体 (`BundleMed`)**
  - `orderName`: 処方名（例:「内服薬処方」）。
  - `className`／`classCode`／`classCodeSystem`: 診療行為名とコード（点数マスター準拠）。
  - 用法: `admin`（表示名）、`adminCode`、`adminCodeSystem`、`adminMemo`（補足）。
  - 投与日数: `bundleNumber`（数字）を設定し、必要に応じて `adminMemo` で投与期間の補足を記載する。
  - 保険種別: `insurance`。
  - 任意メモ: `memo`（患者指導情報などを含める）。
- **構成アイテム (`ClaimItem[]`)**: 処方に含む薬剤ごとに以下を入力する。
  - `name`: 薬剤名（正式名称）。
  - `code`／`codeSystem`: レセ電算コードと体系（通常は ORCA の `srycd`、体系は `MEDIS` 等）。
  - `classCode`／`classCodeSystem`: 薬剤／手技／材料区分。薬剤は `classCode=200`（例）など点数区分に合わせる。
  - `number`: 数量（数値）、`unit`: 単位（錠、mL など）。
  - `numberCode`／`numberCodeSystem`: レセ電算数量コードと体系。
  - `memo`: 調剤指示など自由記述。
  - `ykzKbn`: 薬剤区分（内服=1、外用=2 など）。
- **マスター連携**
  - ORCA `/orca/tensu/code` などで `TensuMaster` を取得し、薬剤名 (`name`)、単位 (`taniname`)、薬効 (`yakkakjncd`)、薬剤区分 (`ykzkbn`) を正確に反映する。
  - 一般名参照 `/orca/general/{srycd}` と併用禁忌 `/orca/interaction` を呼び出し、UI で提示。必要情報（一般名、禁忌理由コードと説明）を `ClaimItem.memo` 等に保持できるようにする。
  - 文書フラグ `DocInfoModel.hasRp` を真にし、処方せん出力時は `DocInfoModel.issuanceDate`、`InstitutionNumber` 等もあわせて設定する。

### 4.2 注射オーダ (`entity = injectionOrder`)

- **スタンプ本体 (`BundleDolphin`)**
  - `orderName`: 施行表示（例:「皮下注射」）。
  - `className`／`classCode`: 主行為（例: 皮下注射 310）とコード体系。
  - `bundleNumber`: 施行回数。必要に応じて `admin`／`adminMemo` で投与経路、速度等を補足。
- **構成アイテム (`ClaimItem[]`)**
  - 手技料、注射薬、使用材料をそれぞれ別アイテムとして追加し、`classCode` に応じた区分を設定。
  - 各アイテムで `code`／`codeSystem`、`name`、`number`、`unit`、`numberCode` を正しく入力する。
  - 注射薬の `ykzKbn` は注射区分を設定（例: 筋注=3）。
- **マスター連携**
  - ORCA 点数マスターの `srysyukbn`（診療区分）で手技／薬剤／材料を判別し、適切な `classCode` を割り当てる。
  - `/orca/stamp/{code}` などの入力セットを利用する場合、ORCA が返す `inputCd`、`suryo1`、`kaisu` をもとに `ClaimItem`／`bundleNumber` を自動充填する。
  - 注射・処置を同一文書で扱う場合は `DocInfoModel.hasTreatment` を真にし、看護記録への反映を可能にする。

### 4.3 処置オーダ (`entity = treatmentOrder`)

- **スタンプ本体 (`BundleDolphin`)**
  - `orderName`: 処置名（例:「処置」）。
  - `className`／`classCode`: 主行為の診療コード（例: 皮膚処置 113）。
  - `bundleNumber`: 施行回数。
  - `adminMemo` や `memo` で処置の詳細（対象部位、手順）を補足。
- **構成アイテム (`ClaimItem[]`)**
  - 処置に使用した薬剤・材料をすべて列挙し、それぞれ `code`、`name`、`classCode`、`number`、`unit`、`numberCode` を設定する。
  - 薬剤が含まれる場合は `ykzKbn` を入力し、レセ電算上の薬剤区分を明確化する。
- **マスター連携**
  - `/orca/tensu/*` API で診療区分 (`srysyukbn`) と点数 (`ten`) を取得し、請求ロジックと整合を取る。
  - 処置系オーダを含む文書では `DocInfoModel.hasTreatment` を真にする。

### 4.4 診断料オーダ (`entity = baseChargeOrder`)

- 初・再診料など 110–125 点数帯のオーダ。`orderName` には「初診・再診」など ORCA が返すカテゴリ名称を設定する。
- `ClaimItem` は通常 1 件（初診料/再診料）だが、特定療養費等がある場合は追加アイテムを列挙する。
- 患者区分に応じた点数コードを ORCA `/orca/tensu/code` から取得し、保険種別に応じた区分（一般・外来・在宅など）を `classCode`・`classCodeSystem` に正確に保持する。

### 4.5 指導・在宅オーダ (`entity = instractionChargeOrder`)

- 点数コード 130–150 帯を対象とする。栄養・服薬指導、在宅訪問指導などを登録する。
- `bundleNumber` には実施回数（日数）を設定し、必要に応じて `adminMemo` に訪問場所や対象者を追記する。
- ORCA 入力セットからの展開時は返却された `suryo1`／`suryo2` や `startDate`／`endDate` を `ClaimItem` 側に引き継ぎ、算定根拠が失われないようにする。

### 4.6 手術オーダ (`entity = surgeryOrder`)

- 500–599 帯のコードを対象とする。麻酔や手術材料など複数アイテムで構成されるため、`ClaimItem` で術式・麻酔・材料をすべて登録する。
- `adminMemo` や `memo` に術式詳細、体位、術者などを記録し、サーバー側の参照時に不足がないよう補足する。
- 大掛かりな処置として `DocInfoModel.hasTreatment` を真にする（処置フラグと共用）。

### 4.7 検体検査オーダ (`entity = testOrder`)

- 600–699 帯を対象とする。検体採取料・検査料・判断料など必要な `ClaimItem` をすべて列挙する。
- 検査依頼番号 `DocInfoModel.labtestOrderNumber` を設定し、Falco 連携など外部送信がある場合は `DocInfoModel.sendLabtest` を真にする。
- 予定カルテで検査日を調整する際は `DocInfoModel.firstConfirmDate`／`confirmDate` の関係に留意し、送信時に正しい日付が計算されるようにする。
- ORCA 側の検査セットは `/orca/inputset` → `/orca/stamp/{setCd}` で展開できる。返却される採取量 (`suryo1`)、保険種別、基準コード (`sstKijunCdSet`) を `ClaimItem` に保持する。
- 文書フラグ `DocInfoModel.hasLaboTest` を真にする。

### 4.8 生体検査オーダ (`entity = physiologyOrder`)

- 心電図・呼吸機能検査など生体機能測定を登録するカテゴリ。必要に応じて測定条件や体位を `adminMemo`／`memo` へ記載する。
- 使用機材・ディスポーザブル品がある場合は材料コードを別 `ClaimItem` として追加する。
- ORCA 点数マスターで `srysyukbn` が 600–699 帯のうち生体検査区分であることを確認し、`classCode` を設定する。

### 4.9 細菌検査オーダ (`entity = bacteriaOrder`)

- 培養・感受性試験などを登録する。検体種別や培地、検査ステップを `memo` に記録しておくとサーバー側で判別しやすい。
- 採取回数や検体本数は `bundleNumber` と `ClaimItem.number` に反映し、材料（培地等）があれば追加 `ClaimItem` として登録する。

### 4.10 放射線オーダ (`entity = radiologyOrder`)

- 700–799 帯が対象。撮影部位・方向・造影剤使用有無を `adminMemo`／`memo` や追加 `ClaimItem` に記載する。
- 造影剤など薬剤使用時は `ykzKbn` を設定し、処方同様に ORCA マスターから名称・単位を取得する。
- 撮影材料（フィルム等）が必要な場合も個別 `ClaimItem` として登録する。

### 4.11 その他／汎用オーダ (`entity = otherOrder`, `generalOrder`)

- 800–899 帯（その他）およびそれ以外のコード（汎用）を扱うカテゴリ。上記のどれにも該当しない場合でもコード・名称・数量情報を漏れなく登録する。
- 汎用カテゴリでは後から正しいカテゴリへ移行できるよう、`memo` に算定根拠や目的を明記する。
- ORCA `/orca/tensu/*` で点数情報を都度確認し、`classCodeSystem` を正しく保持する。

## 5. ORCA 連携時の補助情報

- 点数マスター検索: `/orca/tensu/shinku|name|code|ten` を利用し、コード・名称・点数・適用期間を取得して UI へ提示する。
- 入力セット展開: `/orca/inputset` からセット一覧を取得し、選択されたセットに対して `/orca/stamp/{setCd}` を呼び出して `ClaimItem` 群を生成する。
- 連携時の留意点:
  - ORCA から得たコードとクライアント内部の `ClaimItem`／`BundleDolphin` 構造を突合し、欠落項目（単位・区分など）がないかバリデーションする。
  - CLAIM 送信対象かつ保険請求情報を保持する文書では、`DocInfoModel.sendClaim`、`DocInfoModel.claimDate` などを正しく設定して `KarteServiceBean#addDocument` に矛盾を残さない。
  - 点数コードからカテゴリを逆算する場合は ORCA が定義する範囲（110–125=診断料、130–150=指導・在宅、200–299=処方、300–399=注射、400–499=処置、500–599=手術、600–699=検査、700–799=放射線、800–899=その他、上記以外=汎用）を遵守する。

## 6. バリデーションと送信前チェックリスト

1. 文書全体の `docId`／`docType`／`title`／`purpose` が設定されているか確認する。
2. すべての `ModuleModel` に `beanBytes` と `ModuleInfoBean.entity` が存在し、`entity` が期待する値（`medOrder` 等）になっているか確認する。
3. 各オーダの `ClaimItem` にコード体系、数量、単位、区分 (`classCode`／`ykzKbn`) が不足なく登録されているか検証する。検査・指導では日付・回数 (`bundleNumber`) も漏れなく入力する。
4. ORCA 連携情報（薬剤名、単位、禁忌情報、検査基準コードなど）が最新のマスターから取得されているか確認する。
5. CLAIM 送信や処方せん出力・検体検査送信を行う場合、保険情報・交付日・医療機関番号・`labtestOrderNumber` など関連する `DocInfoModel` フィールドが揃っているか確認する。

上記要件を満たすことで、クライアントから送信されるカルテ文書がサーバー側モデルと齟齬なくマッピングされ、すべてのオーダカテゴリを安全かつ漏れなく登録できます。

## 7. Web クライアント実装補足

- `ChartsPage` ではスタンプ／ORCA 検索から取得した `ModuleModel` を `orderModules` として保持し、`createProgressNoteDocument` へ結合することで ProgressCourse 以外のモジュールをカルテ保存に含めている。
- モジュールの `entity` に応じて `DocInfoModel.hasRp`／`hasTreatment`／`hasLaboTest` を自動的に更新し、オンプレ版と同じ検索／帳票挙動を再現する。
- 保存前にモジュールの `beanBytes` を Base64 デコードして `ClaimItem` 要素の有無を検証し、欠落時はエラーとして保存を中断する。フロントエンドの単体テストで正常系／異常系をカバー済み。
