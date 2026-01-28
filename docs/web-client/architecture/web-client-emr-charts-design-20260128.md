# Charts（カルテ）詳細設計（現行実装準拠）

- RUN_ID: 20260128T123423Z
- 更新日: 2026-01-28
- 対象: Webクライアント Charts 画面（外来）
- 参照: `docs/web-client/architecture/web-client-emr-design-integrated-20260128.md`

## 0. 目的とスコープ
- 外来カルテの **記録・送信・印刷・監査** を 1画面で完結させる。
- 受付情報（Reception）と患者情報（Patients）を **同一RUN_IDで連動**させ、監査ログの可観測性を担保する。
- server-modernized の現行APIで実装可能な範囲のみを対象。

## 1. 現行実装の参照
- 画面本体: `web-client/src/features/charts/pages/ChartsPage.tsx`
- アクションバー: `web-client/src/features/charts/ChartsActionBar.tsx`
- 患者サマリ: `web-client/src/features/charts/ChartsPatientSummaryBar.tsx`
- 左カラム患者タブ: `web-client/src/features/charts/PatientsTab.tsx`
- SOAP: `web-client/src/features/charts/SoapNotePanel.tsx` / `web-client/src/features/charts/soap/*`
- タイムライン: `web-client/src/features/charts/DocumentTimeline.tsx`
- 病名編集: `web-client/src/features/charts/DiagnosisEditPanel.tsx`
- オーダー/処方編集: `web-client/src/features/charts/OrderBundleEditPanel.tsx`
- 文書作成: `web-client/src/features/charts/DocumentCreatePanel.tsx`
- 画像ドック: `web-client/src/features/images/components/*`
- ORCAサマリ/原本: `web-client/src/features/charts/OrcaSummary.tsx` / `OrcaOriginalPanel.tsx`
- SSE: `web-client/src/features/shared/ChartEventStreamBridge.tsx`

## 2. 画面全体構成（文章ワイヤーフレーム）
```
[Skip Link]
- 本文へスキップ

[Header / Topbar]
- タイトル / 説明文
- RUN_ID / dataSourceTransition / missingMaster / cacheHit / fallbackUsed / 編集状態
- 監査サマリ / Charts master / 配信ステータス / ETag / 適用先

[Admin Broadcast / Warning Banners]
- 配信通知 / context alert / edit lock / delivery impact / charts disabled

[Action Bar]
- 診療終了 / ORCA送信 / ドラフト保存 / 印刷
- ロック状態 / 承認状態 / ネットワーク状態 / 再送

[Workbench]
└─ Sticky: 患者サマリバー
└─ 3カラム
   ├─ Left
   │  ├─ PatientsTab（受付履歴/患者検索/監査/Patients連携）
   │  └─ DiagnosisEditPanel（病名CRUD）
   ├─ Center
   │  ├─ SoapNotePanel（SOAP + Subjectives）
   │  └─ DocumentTimeline（受付履歴/請求/ORCAキュー/PushEvent）
   └─ Right
      ├─ 患者メモ
      ├─ OrcaSummary
      ├─ OrcaOriginalPanel
      ├─ MedicalOutpatientRecordPanel
      └─ TelemetryFunnelPanel（debugのみ）

[Utility Drawer]
- 診療操作 / 処方編集 / オーダー編集 / 文書作成 / 画像 / 検査
```

## 3. 主要UI構成（使用者視点）
### 3.1 トップバー
- **目的**: 状態監視と運用判断のためのメタ情報集約。
- **表示内容**:
  - RUN_ID / dataSourceTransition / missingMaster / cacheHit / fallbackUsed
  - 編集状態（readOnly/approval/lock）
  - 監査サマリ（最新 auditEvent）
  - Charts master（配信設定）
  - Charts送信の有効/無効（配信ポリシー）
  - ETag / 適用先

### 3.2 アクションバー（診療終了・送信・印刷）
- **主要操作**:
  - 診療終了（Finish）
  - ORCA送信（Send）
  - ドラフト保存
  - 印刷
- **ガード条件**:
  - missingMaster / fallbackUsed / dataSourceTransition != server
  - 権限不足 / 患者未選択 / ネットワークオフライン
  - 承認ロック / タブロック（readOnly）
- **送信処理**:
  - medicalmodv2 を送信し invoice/dataId を保持
  - medicalmodv23 は診療終了相当として後続送信
- **印刷処理**:
  - ORCA帳票 API へ送信 → `dataId` 取得 → `/blobapi/{dataId}` で PDF 取得
  - 事前確認ダイアログで必要項目（invoice 等）を確認

### 3.3 患者サマリバー（Sticky）
- 患者ID/受付ID/予約ID、年齢・性別、取得日時、承認/ロック状態を表示。
- Reception/Patients からの carry over 情報を保持し、タイムライン/右カラムと同期。

### 3.4 左カラム（PatientsTab + 病名編集）
- **PatientsTab**
  - 受付履歴の一覧（Reception からのエントリ）
  - 患者検索/選択、メモ編集、監査ログ簡易表示
  - Patients 画面への深いリンク（基本/保険の編集）
  - 受付ステータス/role/missingMaster による編集ブロック
- **DiagnosisEditPanel**
  - 病名の作成/更新/削除
  - ORCA disease API と同期、監査ログを付与

### 3.5 中央カラム（SOAP + タイムライン）
- **SoapNotePanel**
  - SOAP入力（S/O/A/P/自由記載）
  - テンプレート挿入/履歴管理
  - 画像添付プレースホルダ挿入（ImageDockedPanel 連携）
  - 症状詳記（ORCA Subjectives）タブ
- **DocumentTimeline**
  - 受付履歴・請求・ORCAキュー・PushEvent を時系列で提示
  - キュー遅延/送信失敗/マスタ欠損時の復旧導線
  - 追加読み込み（無限スクロール/ページング）

### 3.6 右カラム（ORCAサマリ/原本/記録）
- **患者メモ**: 受付/患者情報からの短文メモ
- **OrcaSummary**: `/orca21/medicalmodv2/outpatient` から外来サマリ取得
- **OrcaOriginalPanel**: diseaseget/medicalget/tmedicalget/ diseasev3/medicalmod の XML 原本操作
- **MedicalOutpatientRecordPanel**: ORCA取得結果の要約

### 3.7 Utility Drawer
- **診療操作**: Action bar / タイムライン / ORCAサマリへジャンプ
- **処方編集**: OrderBundleEditPanel（medOrder）
- **オーダー編集**: OrderBundleEditPanel（generalOrder）
- **文書作成**: DocumentCreatePanel（紹介状/診断書/返信書）
- **画像**: ImageDockedPanel（/karte/images → 添付）
- **検査**: 現行は遷移補助（将来の検査UI準備）

## 4. 主要フロー
### 4.1 Reception からの遷移
- Reception の選択行ダブルクリック → Charts を新規タブで開く。
- RUN_ID / patientId / appointmentId / receptionId / visitDate を URL に carry。

### 4.2 患者切替・ドラフト管理
- 患者切替時は **ドラフト未保存**を検知し、切替ブロック/警告。
- SOAP履歴は sessionStorage（最大件数/容量制限）で保持。

### 4.3 ORCA送信・診療終了
- ORCA送信: medicalmodv2 → 結果を送信キャッシュへ保存。
- 診療終了: medicalmodv23 を後続送信（参考情報として記録）。
- 失敗時は再送導線（/api/orca/queue?patientId=...&retry=1）。

### 4.4 印刷
- 帳票種別（処方箋/お薬手帳/カルテ/請求書/明細）を選択。
- 必須情報不足時は事前ガードでブロックし、理由を表示。

## 5. 監査・観測
- 重要操作は `auditEvent` に記録（action/outcome/operationPhase）。
- runId/traceId を画面全体で継承。
- 管理配信のメタ（ETag/Version）をトップバーで可視化。
- ChartEventStream（SSE）で更新通知を受信。欠損検知時は再同期を実施。

## 6. データ/状態管理
- **RUN_ID**: Reception → Charts で引き継ぎ、各APIへ透過。
- **Tab Lock**: 同一患者を別タブで編集した場合 readOnly 化。
- **Approval Lock**: 承認済みの場合は編集不可。
- **送信キャッシュ**: /orca/claim/outpatient と統合し請求状態を再構成。
- **SOAP履歴**: sessionStorage（最大 50件/20エンカウント）。
- **文書履歴**: localStorage（施設/ユーザー単位）。

## 7. API一覧（Charts）
### 7.1 受付/請求/キュー
| 目的 | エンドポイント | method | 主な入力 | 主な出力/扱い |
| --- | --- | --- | --- | --- |
| 受付一覧 | `/orca/appointments/list` / `/orca/visits/list` | POST (JSON) | date/keyword/department/physician | 受付/予約リストの基礎データ |
| 請求状態 | `/orca/claim/outpatient` | POST (JSON) | なし | bundles/queueEntries をタイムラインに反映 |
| ORCAキュー | `/api/orca/queue` | GET | patientId, retry=1 | 送信状況の可視化・再送導線 |
| ORCAイベント | `/api01rv2/pusheventgetv2` | POST (XML) | Base_Date, Event, User | PushEvent の一覧と通知 |

### 7.2 ORCA 送信/会計
| 目的 | エンドポイント | method | 主な入力 | 主な出力/扱い |
| --- | --- | --- | --- | --- |
| 診療送信 | `/api21/medicalmodv2` | POST (XML) | Patient_ID, Perform_Date, Dept | Api_Result / Invoice_Number / Data_Id |
| 診療終了 | `/api21/medicalmodv23` | POST (XML) | Patient_ID, LastVisit_Date | Api_Result |
| 会計情報 | `/api01rv2/incomeinfv2` | POST (XML) | Patient_ID, Perform_Month | 請求情報の補助 |

### 7.3 病名/オーダー/マスタ
| 目的 | エンドポイント | method | 主な入力 | 主な出力/扱い |
| --- | --- | --- | --- | --- |
| 病名取得 | `/orca/disease/import/{patientId}` | GET | from/to/activeOnly | 病名一覧（JSON） |
| 病名更新 | `/orca/disease` | POST (JSON) | operations[] | create/update/delete |
| 病名原本 | `/api01rv2/diseasegetv2` | POST (XML) | Patient_ID, Base_Date | ORCA原本参照 |
| 病名XML更新 | `/orca22/diseasev3` | POST (XML) | XML payload | ORCA原本更新 |
| オーダー束 | `/orca/order/bundles` | GET/POST | patientId, entity | bundle CRUD |
| マスタ検索 | `/orca/master/*` | GET | keyword/effective | generic/youhou/material/etensu など |
| 薬剤詳細補正 | `/api01rv2/medicationgetv2` | POST (XML) | Request_Code | コード補正/選択候補 |
| 禁忌チェック | `/api01rv2/contraindicationcheckv2` | POST (XML) | medication codes | 禁忌/相互作用 |
| 症状詳記 | `/api01rv2/subjectiveslstv2` / `/orca25/subjectivesv2` | POST (XML) | Patient_ID, Perform_Date | 一覧取得/登録 |

### 7.4 文書/画像/帳票
| 目的 | エンドポイント | method | 主な入力 | 主な出力/扱い |
| --- | --- | --- | --- | --- |
| 画像一覧 | `/karte/images`（正）/`/karte/iamges`（typo互換） | GET | patientId, karteId | 画像リスト |
| 画像詳細 | `/karte/image` | GET | imageId | 画像メタ |
| 添付取得 | `/karte/attachment` | GET | attachmentId | 添付内容 |
| 文書保存 | `/karte/document` | POST | 文書 + 添付参照 | 文書ID/監査 |
| 帳票生成 | `/api01rv2/*v2` | POST (XML) | 帳票種別パラメータ | Data_Id を返却 |
| 帳票PDF取得 | `/blobapi/{dataId}` | GET | dataId | PDF BLOB |

### 7.5 Stamp / ユーザー
| 目的 | エンドポイント | method | 主な入力 | 主な出力/扱い |
| --- | --- | --- | --- | --- |
| ユーザー情報 | `/user/{userName}` | GET | userName | userPk 解決 |
| スタンプツリー | `/touch/stampTree/{userPk}` | GET | userPk | スタンプ一覧 |
| スタンプ詳細 | `/touch/stamp/{stampId}` | GET | stampId | スタンプ内容 |

### 7.6 リアルタイム
| 目的 | エンドポイント | method | 主な入力 | 主な出力/扱い |
| --- | --- | --- | --- | --- |
| Chart Event | `/chart-events` | SSE | facilityId/clientUUID | 更新通知（欠損は再同期） |

## 8. 実装上の注意
- 送信・印刷などの **重要操作は必ず確認ダイアログ**を経由する。
- missingMaster / fallbackUsed の場合は編集ブロックし、復旧導線を明示する。
- Utility Drawer は **患者未選択時は disable** し、理由を表示する。
- タブロック/承認ロックは **行動制約 + 理由表示** を必須とする。
