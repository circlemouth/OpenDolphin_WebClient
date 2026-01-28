# Webクライアント 電子カルテ設計（画面構成・統合版）

- RUN_ID: 20260128T060007Z
- 更新日: 2026-01-28
- 対象: 外来（Reception / Charts / Patients / Administration）+ Login + Debug（本番ナビ外）

## 0. 目的と前提
本書は、Webクライアントの画面構成・導線・機能を **server-modernized の現行実装で実現可能な範囲に限定** して統合した設計書である。UXポリシー/将来設計の要素は、**サーバーに実装済みの API で実現できるもののみ**残し、実装不可能な機能は除外した。

- 正本: `docs/DEVELOPMENT_STATUS.md`
- 参照ハブ: `docs/web-client/CURRENT.md`
- Phase2 文書は Legacy/Archive（参照専用）
- 旧来クライアントは参照のみ（`client/`）
- 外来スコープのみ（入院は対象外）

## 1. 統合・参照したドキュメント
- `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`
- `docs/web-client/architecture/web-client-screen-structure-master-plan-20260106.md`
- `docs/web-client/architecture/future-web-client-design.md`
- `docs/web-client/ux/charts-claim-ui-policy.md`
- `docs/web-client/ux/reception-schedule-ui-policy.md`
- `docs/web-client/ux/patients-admin-ui-policy.md`
- `docs/web-client/ux/charts-compact-layout-proposal-20260110.md`
- `docs/web-client/architecture/doctor-workflow-status-20260120.md`
- `docs/web-client/architecture/patient-image-management-status-20260120.md`
- `docs/web-client/architecture/document-embedded-attachment-policy.md`
- `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`
- `docs/server-modernization/orca-additional-api-implementation-notes.md`

## 2. 設計の優先順位（衝突時の判断）
1. `docs/DEVELOPMENT_STATUS.md`
2. `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md`
3. 本書（統合版）
4. 個別 UX ポリシー・将来設計・提案ドキュメント

## 3. グローバル設計（情報アーキテクチャ）

### 3.1 本番ナビ（順序と名称）
本番ナビは **受付 → カルテ → 患者 → 管理** の順で固定する。

| 順序 | 表示名 | ルート | ガード |
| --- | --- | --- | --- |
| 1 | 受付 | `/f/:facilityId/reception` | セッション必須 + facilityId 一致 |
| 2 | カルテ | `/f/:facilityId/charts` | セッション必須 + facilityId 一致 |
| 3 | 患者 | `/f/:facilityId/patients` | セッション必須 + facilityId 一致 |
| 4 | 管理 | `/f/:facilityId/administration` | セッション必須 + facilityId 一致 + system_admin 操作制限 |

### 3.2 ベースルーティング
- `/login`: 未ログイン時の入口。
- `/f/:facilityId/login`: 施設固定ログイン。
- `/f/:facilityId` は `/f/:facilityId/reception` へリダイレクト。
- 印刷プレビュー: `/f/:facilityId/charts/print/outpatient` / `/f/:facilityId/charts/print/document`。

### 3.3 デバッグ/検証画面の隔離
- 本番ナビから **除外**。
- `/f/:facilityId/debug/*` へ隔離し、環境変数 + role でのみ有効化。
- `/f/:facilityId/outpatient-mock` は本番ナビ非表示。

### 3.4 共通 UI シェル
- **トップバー**: ブランド / 施設 / ユーザー / RUN_ID / ログアウト。
- **左ナビ**: 受付・カルテ・患者・管理。
- **通知スタック**: 成功/警告/失敗トースト（3件程度）。
- **RUN_ID 伝播**: 画面全体の `data-run-id` と API ヘッダーへ同期。

## 4. 共通設計原則（全画面共通）

### 4.1 状態フラグとトーン
- 共通フラグ: `dataSourceTransition`, `missingMaster`, `cacheHit`, `fallbackUsed`。
- Tone: error/warning/info/success を統一し、Reception/Charts/Patients/Administration で共通表現。
- `aria-live`: Error/Warning=assertive、Info=polite。

### 4.2 監査・テレメトリ
- `runId`/`traceId` を全操作に付与。
- 主要操作（送信・保存・配信・更新）を audit と telemetry の両方に記録。
- 失敗時は `httpStatus` / `reason` を必須化。

### 4.3 セッション/権限
- 未ログインは `/login` へ誘導。
- facilityId 不一致は専用拒否画面へ。
- Administration 操作は `system_admin` のみ許可（閲覧は可、操作は制限）。

## 5. 画面別設計（実装可能範囲）

### 5.1 Login
- 施設ID / ユーザーID / パスワード / クライアントUUID。
- 成功時に RUN_ID を発行し `/f/:facilityId/reception` へ遷移。
- フィードバックは `role=status`。

**利用API**
- `/user/{userId}`

### 5.2 Reception（受付）
**目的**: 受付・予約の状態を一覧で判断し、Charts/Patients への入口になる。

**構成**
- 上部タブ: 外来受付 / 予約。
- クイック操作: 患者登録 / 当日受付（左寄せ）。
- 検索・フィルタ: 診察券番号・生年月日・氏名/カナ + 診療科/診療種別/担当医。
- 状態別リスト（縦積み）: 受付中 / 診療中 / 会計待ち / 会計済み（ステータスは ORCA/受付状態から決定）。
- 右パネル: 患者サマリ（保険/自費・直近受診・メモ）。

**操作**
- 行クリック: 右パネル。
- ダブルクリック: Charts へ遷移（RUN_ID/受付情報を継承）。
- 例外一覧（再送待ち/失敗）を独立表示。

**更新**
- 自動更新は 30 秒。
- 手動更新ボタンは監査ログへ記録。

**利用API**
- `/orca/appointments/list`
- `/orca/visits/list`
- `/orca/visits/mutation`
- `/api/orca/queue`

### 5.3 Charts（カルテ）
**目的**: 診療録入力・病名・オーダー・文書作成・送信を 1 画面に集約する。

**上段（患者サマリ・バー）**
- 患者名（強調）、ID、性別/年齢、生年月日、受付番号、診療日。
- 安全表示（アレルギー/禁忌/要配慮）。
- RUN_ID と `dataSourceTransition`。

**メインレイアウト（3カラム + ドッキングユーティリティ）**
- 左: 病名要約 + 履歴（過去カルテ/処方歴/サマリ/定期診療）。
- 中央: SOAP入力 + DocumentTimeline。
- 右: OrcaSummary + MedicalOutpatientRecord（参照系）。
- 右ドッキング: 病名編集 / オーダー / 文書 / 画像（閲覧＋添付） / 検査結果などを必要時のみ展開。

**主要タブ（深掘り作業用）**
- 診療録 / 病名 / オーダー / 結果・履歴 / 画像 / 文書 / サマリ。

**主要操作**
- 診療開始 / 下書き保存 / 診療終了 / ORCA送信 / 印刷。
- 引き継ぎコピー（Do）は「下書き扱い + 監査ログ必須」。

**利用API**
- カルテ/文書: `/karte/docinfo`, `/karte/documents`, `/karte/document`, `/karte/modules`, `/karte/moduleSearch`, `/karte/freedocument`, `/odletter/letter`, `/odletter/list/{karteId}`
- 病名: `/karte/diagnosis`, `/orca/disease/import/{pid}`, `/orca/disease/active/{pid}`
- オーダー束: `/orca/order/bundles`
- マスタ検索/相互作用: `/orca/tensu/*`, `/orca/disease/name/*`, `/orca/general/*`, `/orca/interaction`, `/orca/inputset`
- 禁忌/薬剤変換: `/api01rv2/contraindicationcheckv2`, `/api01rv2/medicationgetv2`
- 診療送信: `/api21/medicalmodv2`, `/api21/medicalmodv23`
- 会計確認: `/api01rv2/incomeinfv2`
- ORCAイベント: `/api01rv2/pusheventgetv2`
- 帳票印刷: `/api01rv2/prescriptionv2` ほか + `/blobapi/{dataId}`
- 画像/添付: `/karte/iamges/{karteId,...}`, `/karte/image/{id}`, `/karte/attachment/{id}`
- ラボ結果: `/lab/module`, `/lab/item`, `/lab/module/count`
- 観察値: `/karte/observations`

**画像/添付の扱い（実装可能範囲）**
- 画像の登録は `DocumentModel.attachment` を用いた **文書埋め込み方式**で実現する。
- 画像一覧は `/karte/iamges` と `/karte/image` で参照できる範囲に限定する。

### 5.4 Patients（患者）
**目的**: 患者基本情報・保険・メモを編集し、Reception/Charts と同期する。

**構成**
- 左: フィルタ（診療科/担当/属性）と保存済みビュー。
- 中央: 患者一覧（ID/氏名/保険/未紐付フラグ）。
- 右: 編集フォーム + 監査ログ + ORCA反映ステータス。

**導線**
- Reception から deep link で遷移。
- 保存後は Reception のフィルタ状態を復元して戻る。

**利用API**
- 患者検索: `/orca/patients/local-search`, `/patient/name`, `/patient/kana`, `/patient/id`
- 患者更新: `/orca12/patientmodv2/outpatient`, `/patient`
- 患者メモ: `/karte/memo`

### 5.5 Administration（管理）
**目的**: 配信/運用/権限の確認と ORCA 連携設定の運用を安全に管理する。

**構成（実装可能範囲）**
- 配信/環境設定の確認と切替（AdminConfig）。
- ORCA 接続のリロード操作。
- ORCA キュー監視。
- system_admin 用の Legacy REST 疎通パネル。

**利用API**
- 設定配信/状態: `/api/admin/config`, `/api/admin/delivery`
- ORCA 接続再読込: `/api/admin/orca/transport/reload`
- ORCA キュー: `/api/orca/queue`
- ユーザー管理: `/user`, `/user/facility`

### 5.6 Debug/Outpatient Mock（本番ナビ外）
- 旗管理（missingMaster / cacheHit / dataSourceTransition）と QA 導線。
- `/debug/*` へ隔離し role + ENV 制御。

## 6. 画面間のデータ連携
- Reception → Charts: 受付ID/患者ID/保険モード/フィルタを継承。
- Charts → Patients: deep link で患者編集へ遷移。
- Patients → Reception: フィルタ/ソート/折りたたみ状態を保持して復帰。
- Administration の設定更新は Reception/Charts/Patients にバナー通知。

## 7. 実装可能な追加便利機能（計画外だが有用）
- **リアルタイム更新**: `/chart-events`（SSE）または `/chartEvent/subscribe` を使い、受付・カルテの更新通知を即時反映。
- **帳票PDF生成**: `/reporting/karte` によるローカル帳票の PDF 生成（ORCA 帳票と別系統）。
- **スタンプ/セット運用**: `/stamp/*` を用いた個人/公開スタンプツリーの同期とセット管理。
- **検査結果/観察値表示**: `/lab/*` と `/karte/observations` を利用した結果タブの強化。
- **Legacy REST 疎通パネル**: Administration から `/karte` `/stamp` `/lab` 等の互換 API の疎通確認を行う（system_admin 限定）。

## 8. 本書の更新ガイド
- 改訂時は RUN_ID を採番し、更新日・差分を明記する。
- 画面構成の決定事項が変更された場合は `docs/web-client/architecture/web-client-screen-structure-decisions-20260106.md` を優先して更新し、本書に反映する。
