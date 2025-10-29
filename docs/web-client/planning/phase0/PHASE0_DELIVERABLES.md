# フェーズ0進捗サマリ（2025-10-29 時点）

## 1. 要件レビュー記録
- 対象: `docs/web-client/requirements/WEB_CLIENT_REQUIREMENTS.md` 全章
- レビュー完了日: 2025-10-29
- 結論: 既存要件はフェーズ1実装に必要な範囲を網羅。差戻し事項は無し。
- 追記事項:
  - 患者登録（`PatientResource#postPatient`）を Web クライアントで扱うかは運用チームと要協議。
  - CLAIM 送信 (`/karte/claim`) の自費判定は、`DocInfoModel.isSendClaim` の既定値を確認するタスクをフェーズ1に繰越。
- 変更点ログ: 文書自体の改定は無し。追加議事は本ファイルおよび README の更新で管理。

## 2. REST API インベントリ整備
- 成果物: `docs/web-client/planning/phase0/API_INVENTORY.md`
- 内容: `open.dolphin.rest` および `open.orca.rest` の主要エンドポイントを用途・利用方針・留意点付きで整理。
- 次のアクション: フェーズ1開始前に HTTP クライアント実装観点（タイムアウト、再試行、ロギング）を API 単位で設計し、SDK 設計書へ転記。

## 3. 患者ジャーニー（初診/再診/自由診療）
### 初診（かぜ様症状）
1. 受付 → `/patient/name` で登録済み確認／無ければ仮患者作成フローへ。
2. 問診入力を中央ワークスペースへ取り込み、SOAP 記入。
3. A/P から右レールで処方・検査を発注、`/orca/interaction` で併用禁忌チェック。
4. 署名 → `/karte/document` 送信 → `/chartEvent/event` 通知 → `/karte/claim` （保険診療のみ）。
5. 会計チームへ引き継ぎ、患者指導文書は右レール〔文書〕から出力。

### 再診（慢性疾患フォロー）
1. 左レール「過去サマリ」で前回プラン確認 → `/patient/pvt/{date}` で当日受付リスト表示。
2. バイタルトレンド → `/karte/observations` 参照。
3. SOAP 更新後、A/P から定期処方スタンプ（`/stamp/tree/{userPK}`）を呼び出し調整。
4. `/orca/interaction` で薬剤確認後、署名し `/chartEvent/event` で完了通知。

### 自由診療（美容レーザー例）
1. 受付で保険/自費を右レールで切替（`ClaimConst.RECEIPT_CODE_JIHI`）。
2. 中央ワークスペースで施術記録、右レール〔会計〕で自費メニューを `/orca/tensu/code` から選択。
3. `/karte/document` 保存時に `DocInfoModel.isSendClaim=false` を明示し、保険請求を抑止。
4. 会計へは自費メニューを JSON で渡し領収書出力を依頼。

## 4. ワイヤーフレーム制作計画
- 手法: Figma ローファイ → ハイファイ。1画面完結レイアウトを `ONE_SCREEN_LAYOUT_GUIDE.md` の比率（22/56/22）で再現。
- スケジュール案:
  - 2025-11-04: ローファイ草案（ヘッダ/レール構成）
  - 2025-11-08: ワークショップでフィードバック取得
  - 2025-11-12: ハイファイ + 主要ステート（初診/再診/自費）
  - 2025-11-18: ステークホルダー承認
- 未決タスク: 患者安全アラートの表示優先度、右レールの情報密度（リスト vs タブ）

## 5. 認証ヘッダー仕様・長輪講運用確認
- 既定ヘッダー: `userName` / `password` (MD5) / `clientUUID`。レスポンスヘッダー `X-Dolphin-Session` は未使用。
- 長輪講 (`/chartEvent/subscribe`) の再接続は Web クライアント側でタイムアウト 55 秒・リトライ 5 回を暫定設計。WebSocket 代替案は Phase2 で評価。
- TODO: 認証ラッパーで MD5 ハッシュをクライアント生成するか、サーバーエンドポイントでハッシュ化するかの方針決定。

## 6. リスク・未解決事項
- 患者登録の運用は旧 Swing クライアントとの並行期間に注意。重複登録防止ロジックの整理が必要。
- ORCA API のレスポンスタイムが長い場合のユーザー通知（スピナー/トースト）の UX ポリシー未確定。
- 監査ログ (`/dolphin/activity`) のデータ量が大きいため、抽出条件と保持期間の要件を別ドキュメント化する。

