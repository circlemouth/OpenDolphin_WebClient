# オーダー入力データ要件ガイド

本ガイドは Web クライアントがサーバーへカルテ文書を登録する際に、薬剤処方・注射・処置オーダおよび関連文書メタデータに関して入力すべき情報を網羅的に整理したものです。サーバー側の `DocumentModel`／`ModuleModel` およびオーダ別スタンプ (`BundleMed` など) が期待する項目をすべて満たすよう、以下の要件を遵守してください。

## 1. 文書全体で共通に必要となる情報

- **文書エントリ共通情報**: `DocumentModel` は `KarteEntryBean` を継承しているため、以下の値を必須で設定する。
  - 記録状態: `status`、`confirmed`（確定日時）、`started`（診療開始）、`recorded`（記録日時）。
  - 記録者: `creator`（ユーザー GUID）、`karte`（カルテ GUID）。
  - 連携情報: `linkId`（親文書 GUID）と `linkRelation`（関係種別）。親版がない場合は null を明示する。
- **文書メタ情報 (`DocInfoModel`)**:
  - `docId`（32 文字 GUID）、`docType`（例: `karte`）、`title`、`purpose` を必須で入力する。
  - 診療科 (`department`／`departmentDesc`)、担当医 (`departmentDesc` と併用)、保険 (`healthInsurance`／`healthInsuranceDesc`) を揃える。
  - 処方・注射・処置等の有無フラグ（`hasRp`、`hasInjection`、`hasTreatment` など）を文書内容に応じて設定する。
  - CLAIM 送信設定 (`sendClaim`、`claimDate`、`claimHospitalCode` 等) と交付日 (`issueDate`) を必要に応じて指定し、保険請求挙動と帳票出力に齟齬が出ないようにする。
- **モジュールコレクション**: 文書に含める `ModuleModel`、`SchemaModel`、`AttachmentModel` の一覧を完全に準備し、`KarteServiceBean#addDocument` が正しい親参照を設定できるようにする。不要な空配列は送信しない。

## 2. モジュール共通メタデータ

- `ModuleModel` も `KarteEntryBean` を継承するため、文書側と同様に `status`、`confirmed`、`started`、`recorded`、`creator`、`karte` を必ず保持する。
- スタンプ本体は直列化済みバイト列として `beanBytes`（`@Lob`, `nullable=false`）へ格納する。欠落すると永続化に失敗する。
- `ModuleInfoBean`（埋め込みオブジェクト）では次の項目を必須入力とする。
  - `name`: スタンプ名（文書表示用）。
  - `role`: SOAP/SOA/P などの配置ロール。
  - `entity`: オーダ種別識別子（例: `medOrder`、`injectionOrder`、`treatmentOrder`）。
  - `stampNumber`: 文書内での表示順序。
- その他、`stampId`（スタンプ GUID）、`memo`、`confirmed` フラグ等を必要に応じて設定し、閲覧・検索機能で齟齬が出ないよう維持する。

## 3. 薬剤処方オーダ (`entity = medOrder`)

- **スタンプ本体 (`BundleMed`)**
  - `orderName`: 処方名（例:「内服薬処方」）。
  - `className`／`classCode`／`classCodeSystem`: 診療行為名とコード（点数マスター準拠）。
  - 用法: `admin`（表示名）、`adminCode`、`adminCodeSystem`、`adminMemo`（補足）。
  - 投与日数: `bundleNumber`（数字）と `bundleNumberUnit` があれば併せて設定。
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

## 4. 注射オーダ (`entity = injectionOrder`)

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

## 5. 処置オーダ (`entity = treatmentOrder`)

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

## 6. ORCA 連携時の補助情報

- 点数マスター検索: `/orca/tensu/shinku|name|code|ten` を利用し、コード・名称・点数・適用期間を取得して UI へ提示する。
- 入力セット展開: `/orca/inputset` からセット一覧を取得し、選択されたセットに対して `/orca/stamp/{setCd}` を呼び出して `ClaimItem` 群を生成する。
- 連携時の留意点:
  - ORCA から得たコードとクライアント内部の `ClaimItem`／`BundleDolphin` 構造を突合し、欠落項目（単位・区分など）がないかバリデーションする。
  - CLAIM 送信対象かつ保険請求情報を保持する文書では、`DocInfoModel.sendClaim`、`DocInfoModel.claimDate` などを正しく設定して `KarteServiceBean#addDocument` に矛盾を残さない。

## 7. バリデーションと送信前チェックリスト

1. 文書全体の `docId`／`docType`／`title`／`purpose` が設定されているか確認する。
2. すべての `ModuleModel` に `beanBytes` と `ModuleInfoBean.entity` が存在し、`entity` が期待する値（`medOrder` 等）になっているか確認する。
3. 各オーダの `ClaimItem` にコード体系、数量、単位、区分 (`classCode`／`ykzKbn`) が不足なく登録されているか検証する。
4. ORCA 連携情報（薬剤名、単位、禁忌情報など）が最新のマスターから取得されているか確認する。
5. CLAIM 送信や処方せん出力を行う場合、保険情報・交付日・医療機関番号など関連する `DocInfoModel` フィールドが揃っているか確認する。

上記要件を満たすことで、クライアントから送信されるカルテ文書がサーバー側モデルと齟齬なくマッピングされ、処方・注射・処置オーダを安全に登録できます。
