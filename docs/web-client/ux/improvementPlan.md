# 受付画面改善プラン

## 課題と優先改善案 (マネージャ視点)
Reception 関連 UX は現行で来院一覧・VisitSidebar・危険操作タブと audit 記録が連携する設計だが、Clinician が「何を今優先すべきか」「誰が編集中か」「操作が意図的か」を即座に把握するには回遊性と文脈が不足している。以下の要素を統合した単一の改善プランをマネージャとして取りまとめる。

1. **来院一覧の文脈強化**
   - patient/pvt 系 API を通じて取り込む受付・仮保存・カルテステータスを各行で色・アイコン・ツールチップにより可視化し、本日来院やドクター待ち、カルテ未起動といったフィルタ・ソートをデフォルト提供する。
   - ChartsPage 側の「現在編集中」ステータスや最終更新者情報をバッジで合わせて表示し、どの患者にフォーカスすべきかを Reception→Charts の文脈で直感的に把握できるようにする。

2. **VisitSidebar とカルテ下書きの共有体験確実化**
   - VisitSidebar は document/status を常時表示するが、カルテとの同期（Draft 状態、RUN_ID、共有者情報）が明示されないと誤認が残る。Sidebar 上部に患者名・担当医・最終更新者・更新日時を固定表示し、カルテ画面にも「VisitSidebar 経由の共有下書きです」バッジを出して誰の何かを明示化する。
   - Sidebar を折りたたみ可能とし、目立たない状態でも通知バッジで更新を知らせる。ChartsPage へは直接ジャンプできる導線やリアルタイムの仮保存フラグ（WebSocket 連携）を追加する。
   - 共有下書きの RUN_ID を Reception 画面から自動送信し、バックエンドで集中管理・再送機構と監査ログ (logReceptionAction) の追跡性を担保する。これにより人手漏れを防ぎ、整理された共有体験を実現する。

3. **危険操作の意図明示と監査連携強化**
   - Detail 操作タブを警戒色とし、ホバーやバッジで「logReceptionAction + RUN_ID 監査対象」であることを提示。タブ内での操作前には確認ダイアログ＋依頼者/理由メタデータ入力を必須とする。
   - VisitSidebar や ChartsPage に「危険操作実行中」フラグや監査サマリー（直近 logReceptionAction の RUN_ID、エビデンスパス）を表示し、両画面から操作の意図・履歴にアクセス可能にすることで誤操作リスクを下げる。

## 実施ステップ（優先度順）
1. **ReceptionPage / VisitManagementDialog ワイヤー改訂**
   - 上記 1・2・3 の情報設計を反映し、一覧のフィルタ/ソート UI、Sidebar の折りたたみと通知表示、警戒色の Danger タブ + 二段階確認を含むワイヤーを収束させる。

### RUN_ID=20251129T150500Z: ReceptionPage / VisitSidebar UX モック

- 来院一覧は patient/pvt API 返却のステータス・担当者・最終更新者を色＋アイコン＋ツールチップで表現し、直感的に「会計待ち／Charts編集中／カルテ未起動」の文脈を示す。フィルタには本日来院・ドクター待ち・担当者タグ・RUN_ID の交差タブを用いて、色分けされたタグとキーピースアイコンで注視対象を分類する。
- VisitSidebar は折りたたみ制御と通知バッジを持ち、折りたたんだ状態でも Draft/共有中の更新をバッジやトーストで表現。展開時には「共有 RUN_ID」「通知された担当者」「Charts への即時遷移」を提示してリッチな文脈を提供し、Sidebar 内の Shared Draft に変更があると `logReceptionAction` 経由で RUN_ID を自動送信する操作フローを描く。
- Danger タブは警戒色＋ 2 段階確認（チェックボックス＋意図メモ）で誤操作を抑止し、確認済み操作・VisitSidebar から自動送信された RUN_ID を `logReceptionAction` に付与した状態で監査ログへ連携。UX モックのゴースルーを docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md の該当セクションへ追記し、RUN_ID 自動送信の入口・Evidence パス・Badge 表示を API 側にも可視化する。
- 状態: Implementation/UX チームのレビューで Danger タブの二段階確認 + `logReceptionAction(session.runId)` 呼び出しを確認し、Playwright (VITE_DEV_PROXY_TARGET) で Reception/VisitSidebar + Danger 2 段階カバレッジ追加を検討中。
2. **VisitSidebar 連携仕様書更新**
   - 自動 RUN_ID 添付ルールおよび docs/server-modernization/phase2/operations/logs の各 RUN_ID パターンとの同期フロー、ChartsPage との Draft 共有要件、Audit log との対応を VisitSidebar 仕様に追記する。
3. **危険操作の監査フロー再確認**
   - 監査チームとともに「詳細操作」タブ UI フローと確認ダイアログの文言・必須メタデータ、監査サマリー画面と RUN_ID 表示をレビューし、必要なら改善を加える。

## 受付・スケジュール補助画面の UX 強化
FacilitySchedule や PatientDataExport の構成は予約・カルテ・監査の交差点に位置し、現場担当者は「今見ている予約と Charts のカルテがどう繋がるか」「どの RUN_ID に紐づくエクスポートか」を即座に捉えられる設計を求めている。以下の要素を統合し、カルテ使用者にとって最適な体験をまとめる。

1. **Charts との文脈連携を明示**
   - FacilitySchedulePage の予約詳細ダイアログに ChartLinkPanel 的な「関連カルテへの即時遷移」「最新 RUN_ID／予約ステータスの InfoBanner」を設置し、開いた瞬間に予約→カルテの因果を可視化する。
   - `audit.logChartsAction` や `audit.logScheduleAction` に予約 ID + RUN_ID を送る運用を明文化し、ダイアログ内の操作履歴パネルと Charts 側のバナーで同一 RUN_ID を表示することで追跡性を確保する。

2. **予約操作と RUN_ID 履歴の可視化**
   - 予約（カルテ作成・削除・一括更新）ダイアログに TooltipFields を再利用した「RUN_ID付き操作履歴パネル」を追加し、ステータスバッジ・エビデンスリンクを一覧表示して Charts 操作者が次のアクションを即決できるようにする。
   - 予約削除用 DangerZone には患者 ID 入力＋二段階確認ダイアログ・ステータスバッジ強調を置いて誤操作防止と「何を削除するのか」を明示し、`logReceptionAction` のように監査ログと RUN_ID を密に結びつける。

3. **PatientDataExport の Charts 連携と監査表示**
   - Administration 内の Export に Charts 側の患者・日付範囲選択をプリセットできるショートカット（例：ChartsPage 右上メニューから直接エクスポート）を追加し、`PatientDataExportPage` で現在の Charts 処理対象を即反映する。
   - CSV/JSON ファイル名・本文・ダウンロードボタン aria 属性に RUN_ID を盛り込むとともに、InfoCard で最新 RUN_ID／最終取得件数を表示し、`audit.logAdministrativeAction` で同 RUN_ID を送ることでエビデンス追跡を一環化する。

## 実施ステップ（スケジュール領域）
1. **FacilitySchedule 予約ダイアログ改修**
   - ChartLinkPanel・TooltipFields/runId 表示を含むモーダルテンプレートを作成し、`useChartsContext` で現在表示中カルテとのマッピングを取得。`audit.logChartsAction`/`audit.logScheduleAction` へ `runId` を渡す。
2. **RUN_ID 履歴パネルと DangerZone 強化**
   - `recordOperationEvent` や `TooltipFields.progress` を再活用して予約操作履歴パネルを実装し、DangerZone を二段階確認・患者 ID 再入力とし、Chart 側への publishChartEvent 相当の再描画トリガを検討。
3. **PatientDataExport のエクスポート連携**
   - Charts からのプリセット query＋RUN_ID 表示・ファイル名・JSON/CSV metadata への埋め込みを実装し、`recordOperationEvent('administration','info','patient_data_export',...)` を追加。DOC_STATUS および `docs/server-modernization/phase2/operations/logs` の該当 RUN_ID 行にも追記し監査証跡を整える。

ステップ実行時は `docs/web-client/planning/phase2` のゴールに沿って DOC_STATUS を更新し、関連証跡を `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に残す。新しい RUN_ID 取得時には `YYYYMMDDThhmmssZ` フォーマットで採番し、補助画面の変更・監査ログ・証跡リンクをすべて同一 RUN_ID で横断させる。

## カルテ画面の統合 UX 改善
ChartsPage は左 DocumentTimeline、中央カルテ本体、右複数パネル（DocumentTimelinePanel/DiagnosisPanel/ObservationPanel/ClaimAdjustmentPanel/MedicalCertificatesPanel/OrcaOrderPanel/StampManagementPage）で /karte/*〜/mml/*、/orca/* を扱う構成だが、情報密度と監査追跡が高まりすぎて現場の視線・操作連携に摩擦が生じている。これをマネージャ視点で統合的に整理する。

1. **パネル構成の整理と文脈連携**
   - 右カラムの DocumentTimelinePanel/Diagnosis/Observation などをタブ/アコーディオン化して展開タイミングを制御し、カルテ本体の横幅と視線連続性を確保。DocumentTimeline と連携して lab/module や images を選択した際に関連メタ情報を即表示し、LabResultsPanel や MedicalCertificatesPanel へのショートカットを強調する。
   - Timeline・ORCA 右ペイン・カルテ本体間で操作同期を実装（例：Observation 更新時に本体の対応セクションをハイライト・スクロール）し、左右の情報を自動的に連動させることでミスを低減する。

2. **ORCA 操作の監査可視化とアクセシビリティ**
   - OrcaOrderPanel/StampManagementPage に「禁忌チェックステータス」「最終同期時刻」「logChartsAction/logOrcaQuery の RUN_ID」などを固定表示し、ステータスバッジとキーメトリクスで制御フローを視覚化。点数帯スライダー＋ショートカット UI で /orca/tensu/* クエリとの連携を強化し、検索結果を StampManagement へ渡すトレースを同 RUN_ID で文書化する。
   - 操作完了タイミングを aria-live 対応で通知し、スクリーンリーダー利用者も含めた注意喚起を行う。

3. **監査・文脈カードの統合**
   - DocumentTimelinePanel のカードから PUT /karte/document を呼び出し、進行記録コンポーザのバージョン履歴・CLAIM 再送信ログを示すとともに、lab/module や letter/* のイベントに右ペインの ORCA 情報を紐づけるコンテクストカードを中央カルテに表示し、病歴と処方の整合性を強化。
   - 各操作に紐づく RUN_ID や監査ログのエビデンスパスを一貫して表示することで、画面操作と audit 記録の対応を直感的に確認できるようにする。

## アプリケーションのリアルタイム/再接続 UX
SSE + REST の組合せで gapSize/sequence を管理し、ReplayGapProvider や AppShell で `chart-events.replay-gap` を監査含めて共有しているものの、gap の具体的状態やユーザー側の再接続判断、Runbook/証跡への橋渡しが不十分なので、以下の改善をマネージャ視点でまとめる。

1. **Gap 状態の可視化と再取得操作**
   - gapSize・gapDetectedAt・Last-Event-ID を ReplayGapBanner（および ChartSyncStatus コンポーネント）に表示し、「○件分のイベントが未反映」「最新イベントID＝…」といった具体値を示す。再接続のボタンをバナー内に常駐させて `rest/charts/patientList?clientUUID=…&sequence=…&gapSize=…` を叩くフローを明示し、操作で `ReceptionReloadAudit` や `audit.logReplayGapState(action="manual-resync")` の証跡を残す。
   - Gap 状態を PatientList 再取得だけでなく UI に保持し、トーストを閉じた後でも Charts/Reception のヘッダーや一覧近くで進捗を確認できるようにする。

2. **Runbook/監査リンクの提供**
   - AppShell・ChartsPage 右上に gap 発生時の RUN_ID と ops ログリンク（例 `20251116T170500Z` ログ §1）を表示し、ユーザーが監査用途にその時間帯のイベントを辿れるようにする。バナー・再接続ボタンに RUN_ID を載せ、 docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md 内で gap 用欄を設けて、監査・Runbook §2.3 のステップと連動させる。
   - ReplayGapProvider が保持する `sequence-oldestHistoryId` 値や gap イベント発生の Micrometer 指標との同期を表すモジュールを作成し、UI から `chart-events.replay-gap` を再送する操作（再取得失敗時にロングポーリング切り替えや manual restart モーダル）と Ops/monitoring ルールをリンクする。

3. **SSE 状況インジケータと段階的フェールオーバー**
   - AppShell で SSE バッファ（100件）への到達度をゲージ化し、保持割合が高まるほど黄色→赤で警告し、「約40分分のバッファ」に対する意識付けを行う。
   - 保持率が閾値（例 retained ≥ 90）を超えると ReplayGapProvider に `chart-events.replay-gap` を再送させ、UI から「ロングポーリングフェールオーバー」や「オペレーション再起動」モーダルへ誘導。これにより長時間切断での自動対応とユーザーの再同期行動が整合する。

## リアルタイム改善ステップ
1. **Gap 可視化 UI＋ステータスカード**
   - `ChartSyncStatus` コンポーネントを ChartsHeader/ReceptionHeader に挿入し、`useChartsReplayGap` の gap データを受け取ってヘッダー表示・バッジ化。バナー/トーストを閉じても gap 状態のカードで再取得操作を提供し、`replayGapContext.retry()` のトリガを常駐化。
2. **Runbook/監査リンクの整理**
   - AppShell/Charts の UI に RUN_ID と ops ログリンクを追加し、 gap 発生時の再取得アクションを `audit.logReplayGapState(action="manual-resync")` で記録。`docs/web-client/ux/legacy/CHART_UI_GUIDE_INDEX.md` および `API_SURFACE_AND_AUDIT_GUIDE.md` に gap ステータスと操作の読み替え方を記載し、DOC_STATUS へ RUN_ID と証跡パスを追記。
3. **SSE インジケータ・フェールオーバーの設計**
   - SSE バッファ割合指標を AppShell で可視化し、閾値超過時に `chart-events.replay-gap` 再送＋UI のフェールオーバーモーダルを出すシナリオを設計。Ops monitoring（`ops/monitoring/chart-event-alerts.yml` 等）と整合させ、長時間 gap でのユーザー行動をガイドする。

各ステップは DOC_STATUS と `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` の RUN_ID 記録に従い、UI/Runbook/証跡を一体化して再接続 UX を安定化させる。

## 管理画面（Administration）の信頼性強化
SystemPreferencesPage / UserAdministrationPage は Ops/Admin ロール限定で Cloud/Facility 操作と audit.logAdministrativeAction の RUN_ID 記録を担保しているが、Charts 側からは何が変更されたのか見えにくく、危険操作や監査ログの存在が伝わりづらい。カルテ使用者の安心感を高める観点で以下の統合的な改善を提案する。

1. **危険操作の説明とバウンダリ可視化**
   - 管理画面ヘッダー付近に「Ops/Admin 限定」「Cloud/Facility 設定専用」などの説明文＋アイコンを掲示し、Charts 利用者が誤って深部に入っても即座に意図を把握できるようにする。また、Danger 操作（例：DELETE /user/{userId}）の直前にはバナーやダイアログで「RUN_ID＋audit ログ付き」「2段階確認」などを表示し、意図の認識と誤操作防止を両立する。

2. **監査ログとの双方向リンク**
   - Administration 操作パネル横に「audit.logAdministrativeAction で RUN_ID（例：20251116T170500Z）を記録しています」と注記し、該当 RUN_ID で logs/ファイルへ飛べるショートカットを設ける。Charts 右ペインにも「最新の Admin RUN_ID」「該当 API」「操作者」を表示し、clickで証跡ログへ遷移できる deep link を提供する。libs/audit への RUN_ID 付与確認と文書化も併行する。

3. **Charts ⇔ Admin の文脈共有**
   - ChartsPage 右ペインに SystemPreferences が保持する CloudZero / JMARI / CLAIM 状態や施設オペレーションの StatusBadge を再掲し、クリックで該当管理画面へ遷移するショートカットを追加する。さらに、Administration 側には「カルテ影響度セクション」を設け、各設定項目と依存する Charts のパネル（OrcaOrderPanel や ClaimAdjustmentPanel 等）を短い説明付きで列挙し、どの変更がカルテに効いてくるかを明示する。
   - docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md に Chart→Admin の連携フロー（ステップ・RUN_ID・監査ログ参照先）を追記し、カルテ画面からもアクセスできるようヘルプリンクを追加する。

## 管理画面改善ステップ
1. **メッセージ／バナー＋リンク設計**
   - SystemPreferences/UserAdministration にバウンダリ説明・RUN_ID 表示・ログリンクを含む UI モックを作成し、カルテ利用チームとレビュー。Docs にも `API_SURFACE_AND_AUDIT_GUIDE.md` で同様の解説を明記。
2. **RUN_ID ログ連携の整備**
   - `libs/audit` の RUN_ID 周りのユニットテスト・実装を確認・補完し、最新の `audit.logAdministrativeAction` を追跡可能に。必要に応じて `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` へ証跡を提示。Charts 画面のステータスカードや監査バナーも更新。
3. **Chart→Admin 連携フローのドキュメント化**
   - `docs/web-client/ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` に Chart から Administration への相談手順・ステップ図・RUN_ID 追跡フローを追加し、Doc から deep link で logs ファイルへ遷移できるように整備。DOC_STATUS へ追加 RUN_ID と証跡パスを記録。

これらステップも他セクションと同様に DOC_STATUS および `docs/server-modernization/phase2/operations/logs/<RUN_ID>-*.md` に RUN_ID を明記し、証跡と UI 仕様を同期させることで計画と実装の一貫性を保つ。
