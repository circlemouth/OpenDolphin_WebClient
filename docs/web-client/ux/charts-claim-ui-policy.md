# カルテ・請求 UX ポリシー（RUN_ID=20251202T090000Z）

- 参照元: [src/webclient_screens_plan/01_phase2/screens 3 文書の棚卸.md](../../../src/webclient_screens_plan/01_phase2/screens%203%20文書の棚卸.md)
- 証跡ログ: [docs/server-modernization/phase2/operations/logs/20251202T090000Z-screens.md](../../server-modernization/phase2/operations/logs/20251202T090000Z-screens.md)
- 目的: 受付から渡された患者の診療録入力・病名管理・オーダー・結果閲覧・文書生成をブラウザ内で完結させ、診療終了と ORCA 送信を安全に結ぶ。

## 1. 役割とヘッダー
- 患者基本情報＋受付情報＋注意フラグをヘッダー常時表示し、保険/自費トグルと保存/下書き/診療終了/署名ボタンを配置。
- 診療終了時に受付ステータス更新と ORCA 送信キュー投入を同一操作で行い、エラーを Reception の診察終了タブへ返す。
- role に応じて入力/承認権限を分離（看護師は下書き、医師が署名、事務は閲覧中心）。

## 2. タブ構成とユースケース
- 診療録: SOAP/フリー切替、テンプレ呼出、過去サマリ参照、ショートカットキー、自動保存設定を適用。
- 病名: 保険病名＋転帰、適用チェック、未紐付オーダー一覧、病名検索結果からの直接登録。
- オーダー: 処方/注射/検査/処置・指導/リハ/予防接種/文書オーダーのサブタブ。セット呼出/登録、ORCA マスタ候補表示。
- 結果・履歴: 検査結果、処方/オーダー履歴、病名未紐付ショートカットをまとめ、再オーダーを短縮。
- 画像(DICOM): 履歴一覧＋ビューア、カルテ貼付リンク生成、必要時に外部ビューアへの遷移も示す。
- 文書: 診断書・紹介状等の下書き生成、PDF/印刷。カルテ本文との整合をチェックするガードを表示。
- サマリ: 長期経過・問題リスト・タイムラインを俯瞰し、前回診療からの変化点を強調。

## 3. 右サイドバーとサジェスト
- 患者メモ（一般/医師専用）を常設し、ARIA live の必要性を検討。
- 今日のチェック項目（病名未紐付や ORCA エラー警告）、医師お気に入り/病名ベースのオーダー候補を表示。
- セット/テンプレ/初期表示モードは Administration で設定されたデフォルトを継承する。

## 4. データ・API 前提
- 診療録/テンプレ/サマリ/患者メモ CRUD の ChartResource。
- 病名検索・転帰更新・オーダー紐付チェック用の Disease/Order link API。
- 薬剤/注射/検査/処置/リハ/予防接種/文書オーダーの登録・更新を扱う Order API と、候補表示用 ORCA マスタ参照 API（適用病名チェック含む）。
- セット管理 API（標準/医師お気に入り/患者・病名サジェスト）。
- DICOMResource で検査履歴・画像取得・カルテ貼付リンク生成。結果・履歴取得 API（検査結果、処方/オーダー履歴）。
- 診療終了/署名で受付ステータス更新と ORCA 送信を行うエンドポイント。すべての編集/承認に監査ログを付与。

## 5. 遷移・前提
- Reception から患者IDと保険/自費モードを受け取り初期化。診療終了後は Reception のステータス「診療終了」と ORCA 送信の成否を同期。
- role 切替はサーバー配布の `roles/permissions` をガードとして適用し、承認フローを UI 表示と連動させる。
- DICOM や ORCA マスタが取得不可の場合の fallback UI（警告バナーとリトライ導線）を、RUN_ID=20251202T090000Z の検証対象として記録する。

## 6. アラートバナー / ライブリージョン（Charts=Reception 共通）
- 対象イベント: ORCA 送信エラー/完了、未紐付病名、送信キュー遅延（署名後・再送時）。Reception と同一文言・tone を使い、色は Error=赤、Warning=琥珀、Info=青で統一。
- `aria-live`: エラー/未紐付/遅延は `assertive`、完了/情報は `polite`。`data-run-id=\"20251202T090000Z\"` と `role=alert` を付け、Reception 診察終了タブへ carry over できるようにする。
- 文言構造: `[prefix][送信結果 or 未紐付件数][患者ID/受付ID][対象タブ（病名/オーダー/署名）][再送/解除導線]` を固定し、Charts で表示したバナーは Reception へ戻った際に最新状態をミラー表示。
- 右サイドバーのチェック項目にバナー状態をミラーし、未紐付病名をクリックで病名タブへジャンプ。未紐付は `aria-live=assertive` で 1 回だけ読み上げ、未解決のままタブを離れた場合は再度読み上げない。
- ログ出力: 署名/診療終了/再送/診療終了解除/未紐付解消の各操作で `action`, `patientId`, `queueStatus`, `tone`, `ariaLive`, `runId=20251202T090000Z` を監査ログに追加し、Playwright の `fetchAuditLog` で検証可能にする。

## 7. ステータス遷移・自動/手動更新・権限制御
- ステータス遷移: Charts で「診療開始」→「診療終了」→「署名・送信」までを完結させ、結果を Reception に同期。診療終了取り消しは医師/管理者のみ、署名後の ORCA 再送は医師/看護/受付が実施可（管理者はルール変更可）。
- 自動更新: ORCA キュー/バナー状態を 30s 間隔でポーリングし、診療終了後の遅延を Reception と同じトーンで知らせる。`aria-live` を維持しつつ再読み上げを避けるため `aria-atomic=false` を指定。
- 手動更新: 「キューを再取得」ボタンで即時リロードし、直前タブ/フォーカスを保持。`manualRefresh=true` を監査ログへ書き出す。
- 権限制御: role=医師は署名/診療終了/再送、看護は下書き/再送、受付は閲覧と再送、管理者は全操作＋遷移ルール編集。非活性ボタンには権限不足の理由を tooltip で表示。

## 8. 次アクション（RUN_ID=20251202T090000Z）
- ORCA エラー共有バナーと病名未紐付警告の aria-live/tone を Reception と揃え、`ux/ux-documentation-plan.md` で Playwright への引き継ぎ条件を整理する。
- セット管理 API のデフォルト継承ルール（Administration 側設定→Chart 初期表示）を精査し、管理画面ポリシー側と突合する。

## 9. テスト観点メモ
- 病名/オーダー登録エラーのバナーが `aria-live` で読まれ、タブ遷移時にもフォーカスが逸れず tone が崩れないか。
- 診療録⇔病名⇔オーダー⇔結果タブの遷移で最後に操作したフィールドへフォーカス復帰し、ライブリージョンが二重読み上げしないか。
- Reception から渡された保険/自費モードが診療終了まで保持され、オーダー登録や署名時に正しいモードで送信されるか。
- ORCA 送信エラー/未紐付病名警告が診療終了ボタン押下後すぐに表示され、再送時にメッセージが更新されるまでの遅延を計測する。

## 10. DocumentTimeline・OrderConsole・OrcaSummary の状態と aria-live (RUN_ID=20251203T210000Z)

- 受付画面の `docs/web-client/ux/reception-schedule-ui-policy.md §5` で決めた `Error/Warning=assertive`・`Info=polite` のライブリージョン構成と `role=alert` を、外来 Charts 右ペインの DocumentTimeline/OrderConsole/OrcaSummary でも共通化する。受付から渡される患者ID・保険/自費フラグ・調整中ステータスは `DocumentTimelinePanel` が受け取り、同じ `data-run-id` でスクリーンリーダーが更新を区別できるようにして Reception へ carry over する。
- `DocumentTimeline` のライブリージョンは `aria-atomic=false` によって前回の読み上げ状態を保持しつつ、赤/琥珀/青の tone を色で切り替える。`missingMaster`/`fallbackUsed`/`dataSourceTransition` の警告は OrderConsole の `DataSourceBanner` から OrcaSummary に展開され、監査ログ（`action/patientId/queueStatus/tone/ariaLive/runId`）へ tone + `aria-live` を透過する。

| 状態 | トリガ・説明 | Tone + aria-live | Reception との整合 |
| --- | --- | --- | --- |
| 文書を編集中・履歴ロード直後 | `DocumentTimeline` に過去イベントが描画され、最新イベントが選択済み。 | Info（`aria-live=polite`）、`role=alert` で静的情報を一度だけ読上げ。 | `Reception` の `受付→診療開始` ステータスと同じ `polite` 情報を保持。 |
| ORCA キュー投入・送信中 | 「診療終了」/「再送」で `DocumentTimeline` が ORCA queue を呼び出し、`Queue` バナーを表示。 | Info（`aria-live=polite`）、`data-run-id` 増分ごとに再読上げ。 | Reception の診察終了タブの `polite` バナーと同期し、再送中トーンを一致させる。 |
| 送信成功・再送成功 | ORCA から ACK を受け、バナーが緑色で「送信済み」に遷移。 | Info（`aria-live=polite`）、成功メッセージで色を青→緑に変更。 | Reception でも `polite` 完了バナーを表示し、トーンと aria の一致を保証。 |
| ORCA エラー・未紐付・遅延 | ORCA エラー・未紐付病名・キュー遅延を `OrcaOrderPanel` が受け取り、`tone=error` に切り替える。 | Error/Warning（`aria-live=assertive`）、`aria-atomic=false` で重複読み上げを抑えながら赤/琥珀バナーを表示。 | Reception の `role=alert` エリア（赤または琥珀）へ `assertive` で carry over。 |
| マスターデータ fallback・`dataSourceTransition` | ORCA マスター取得が `snapshot`/`msw`/`fallback` に遷移し、`missingMaster`/`fallbackUsed`/`dataSourceTransition` を検知。 | Warning（`aria-live=polite`）、`DataSourceBanner` が `dataSourceTransition=server→snapshot` などを更新。 | Reception の warning tone (`polite`) を継承しつつ、主要エラーと混ざらないよう aria-live を分離。 |

- OrderConsole は保険/自費トグル・文書バージョン・ORCA 再送の status を監視し、`DocumentTimeline` へ `insuranceMode`/`patientMode` をそのまま渡す。`FilterBadge` の `missingMaster`/`fallbackUsed`/`dataSourceTransition` は `aria-live=polite` で更新され、監査メタ（`dataSourceTransition.from`/`to`/`reason`）を `audit.logUiState` や `audit.logOrcaQuery` に `action=filterChange` として送出する。
- OrcaSummary（`DataSourceBanner` + `OrcaStatusList`）は `/resources/api/orca/master/*` の取得結果をもとに `missingMaster`/`fallbackUsed`/`dataSourceTransition` を表示し、同じ値を監査ログ（`dataSourceTransition`/`missingMaster`/`fallbackUsed`）と UI に透過する。`aria-live="polite"` の帯域を使い、繰り返し発生する `missingMaster` 警告でも二重読み上げを避ける。

## 11. 外来 API カバレッジ（入院 API は N/A）

- 受付→カルテ導線、保険/自費フィルタ、監査メタ（`dataSourceTransition`/`missingMaster`/`fallbackUsed`）は外来 API に限定した coverage table にまとめ、次の API マッピング作業へ渡す資料を `artifacts/webclient/ux-notes/20251203T210000Z-charts-ux.md` に残す。

| UXフォーカス | 外来 API | 備考 | 入院 API |
| --- | --- | --- | --- |
| 受付→カルテ導線 | `GET /api/pvt2/pvtList`（Reception の一覧取得）＋`GET /api/karte/docinfo/{karteId}`・`GET /api/karte/documents`（DocumentTimeline の描画） | 受付で選んだ患者ID+保険/自費モードを `DocumentTimeline` に渡し、文書ロード・ORCA 再送・`data-run-id` 更新を外来のみで確実化。 | N/A（外来限定検証） |
| 保険/自費フィルタ | `GET /api/patient/{patientId}` とその保険情報（`healthInsurance` 配列） | `OrderConsole` が `insuranceMode` をトグルし、`DocumentTimeline` 側でも同じフィルタを再現。Receptions のフィルタと同期するため `insuranceMode` クエリを `chart` API に渡す。 | N/A |
| 監査ログ：`dataSourceTransition`/`missingMaster`/`fallbackUsed` | `GET /resources/orca/master/{generic-class, generic-price, youhou, material, kensa-sort, hokenja, address, etensu}` + audit endpoints | OrcaSummary で `DataSourceBanner` を更新し、`audit.logUiState`/`audit.logOrcaQuery` に meta を添えて `OrcaSummaryPanel` へ流す。これらの meta は外来 API を起点に `dataSourceTransition` の履歴を追跡する。 | N/A |
