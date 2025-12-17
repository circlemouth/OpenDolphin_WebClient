# 24 OrcaSummary（請求/予約）商用レベル仕上げ（webclient charts production outpatient plan）

- RUN_ID: `20251217T130407Z`
- 期間: 2026-01-08 09:00 〜 2026-01-11 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: gemini cli
- YAML ID: `src/charts_production_outpatient/ux/24_OrcaSummary_請求予約_商用レベル仕上げ.md`

## 0. 目的とアウトカム
- 請求/予約サマリを **診療中の意思決定に足る粒度**（当日請求額・未収/自費・直近予約の衝突/院内導線）で提示し、`dataSourceTransition` と取得元を明示して誤読を防ぐ。
- `fallbackUsed=true` を **強警告** として扱い、計算が暫定であること・送信不可/要再取得であることを即座に伝える。
- 予約画面/会計画面/再取得へ **1〜2クリックで辿れる導線** を配置し、トップバーのピルと一貫した tone/aria を維持する。

## 1. 参照チェーン・インプット
- `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`
- UX ポリシー: `docs/web-client/ux/charts-claim-ui-policy.md`（§10 aria-live）, `src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md`（ピル順序/aria）, `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`（再取得 CTA）, `14_パフォーマンス予算と計測導入.md`（Skeleton/TTV 目標）
- 実装ログ: `docs/web-client/planning/phase2/logs/20251211T120619Z-charts-timeline.md`（OrcaSummary データバインド）を既知の前提とする。

## 2. 表示粒度（診療中に必要な最小セット）
- **当日請求サマリ（claimSummary）**: 受付番号・保険/自費モード・総額（税込/税抜）・点数・窓口負担額・未収/過収・レセ電送信可否。`recordsReturned` は行数ではなく「請求対象件数」を表示。
- **計算根拠メタ**: `runId / dataSourceTransition / cacheHit / missingMaster / fallbackUsed / fetchedAt` を Topbar ピル順と同じ並びで表示し、`dataSourceTransition` には `from→to` + 理由（retry/server/fallback）を添える。
- **予約サマリ（appointmentSummary）**: 直近 3 件（当日以降 30 日）の予約を「日時・診療科・種別（再診/処置/検査/リハ）・場所・ステータス（予定/来院済/キャンセル）」で表示。オーバーブッキング/重複はピル `tone=warning` で強調。
- **衝突と支払い注意**: 予約の被り、未収金、保険期限切れを一行カードでまとめ、クリックで該当タブ（予約/会計/保険）へジャンプ。`aria-live=assertive` を衝突/期限切れに限定し、情報系は `polite`。

## 3. dataSourceTransition とバナーの扱い
- DataSourceBanner を OrcaSummary 上部に固定し、Topbar ピルと同一の copy/tone/aria を使用（22 章準拠）。`data-run-id` を付与し DocumentTimeline/PatientsTab と同期。
- `dataSourceTransition` の説明コピー:
  - `mock→server`: 「モック値から ORCA 本番値へ更新中（再計算待ち）」※ tone=info, aria=polite
  - `server→snapshot`: 「サーバーデータ欠損のため snapshot を参照（暫定計算）」※ tone=warning, aria=polite
  - `server→fallback` または `fallback→server`: 「fallbackUsed=true｜計算は暫定。再取得してください」※ tone=error (fallback), tone=info (復帰), aria=assertive when entering fallback
- `recordsReturned=0` かつ `missingMaster=true` の場合は「請求計算を停止」バナーを表示し、送信系ボタンを disable（理由 tooltip=`missing_master`）。

## 4. `fallbackUsed=true` 時の強警告
- ToneBanner: `tone=error`, `aria-live=assertive`, 文言「計算が暫定（fallbackUsed=true）。請求/予約を確定せず再取得してください」。
- ActionBar/OrcaSummary CTA: 送信・署名・再送を disable。再取得ボタンのみ活性化し、押下時に `manualRefresh=true` を監査へ送る（12 章規約）。
- OrcaSummary 内表示: 計算値の右肩に「暫定」ラベルを赤字で付与し、差分を強調する（点数/負担額はグレーアウト）。
- 解除条件: `fallbackUsed=false` を受信した瞬間に info バナーへ戻し、Topbar/左ペインチェック項目も同時に更新。読み上げは `aria-live=polite` で 1 回のみ。

## 5. 関連導線（1〜2クリックで到達）
- **予約へ遷移**: OrcaSummary 右上に `予約へ` ボタン（Link as="button"）。クリックで `ChartsPage` 内の予約タブを開き、直近予約 ID をクエリでハイライト。ナビゲーション後も Topbar ピルを維持。
- **会計へ**: `会計へ` ボタンで Reception の会計タブ（新規タブ _blank を避け、同シェル内で遷移）へ。未収がある場合はボタンラベルにバッジ `未収あり` を付与。
- **再取得**: `再取得` 二次ボタンを OrcaSummary ヘッダーに常設。`manualRefresh=true` で React Query `refetch()` を呼び、失敗 3 回で `tone=warning` + tooltip「管理者へ連絡」。
- **予約新規作成**: 予約サマリ下に `新規予約` ボタン。押下時に患者ID/保険モードを prefill し、予約種別セレクトにフォーカス（21 章のキーボード方針に従う）。
- これら 4 ボタンは wide/default で横並び、medium で 2x2 グリッド、narrow で縦積み。ActionBar とは役割が異なるため OrcaSummary ローカルに配置する。

## 6. ステート別 UI
| 状態 | トーン/ARIA | アクション可否 | 備考 |
| --- | --- | --- | --- |
| 正常 (`fallbackUsed=false`, `missingMaster=false`) | info/polite | 予約/会計/再取得=○、送信系=Topbar 権限どおり | DataSourceBanner は info。 |
| `missingMaster=true` | warning/assertive | 送信/会計=×、予約=○、再取得=○ | tooltip=`missing_master`。左ペインチェック項目に同期。 |
| `fallbackUsed=true` | error/assertive | 送信/会計/予約の確定操作=×、再取得=○ | 計算値に「暫定」ラベル、ActionBar disable 理由=`fallback_used`。 |
| 再取得中 (`isFetching=true`) | neutral/polite | ボタンは `loading` 表示、再クリックを抑制 | Skeleton 表示（§8）。 |

## 7. ARIA / キーボード
- `ToneBanner` は role=`alert`、`aria-live` は tone に従う（22 章）。`aria-atomic=false` で重複読み上げを防ぐ。
- ステータスピルは role=`status`、`aria-live=off` 初回のみ `polite`。順序は `runId` → `dataSourceTransition` → `missingMaster` → `fallbackUsed` → `cacheHit`。
- フォーカス順: ToneBanner → DataSourceBanner → 金額サマリ → 予約サマリ → アクション群。`Tab` 1 巡で全要素に到達できること。
- キーボードショートカット: `Alt+R`=再取得、`Alt+B`=会計へ、`Alt+A`=予約へ。重複を避け ActionBar のショートカットと被らないよう設定。

## 8. パフォーマンスと Skeleton
- 目標: 初期描画 1200ms 以内に OrcaSummary スケルトンを表示（14 章 P95 基準）。予約サマリも同じ Skeleton コンポーネントを流用。
- Skeleton: DataSourceBanner ライン + 金額 3 行 + 予約 3 行を固定高さで shimmer なし表示。`data-loading-scope="orca-summary"` を付与。
- 再取得時はスケルトン再表示を避け、バナーのみ `loading` ピルを点灯させて視覚ジャンプを防ぐ。

## 9. 監査・テレメトリ
- 監査 (`audit.logUiState`): `action=orca_summary_refresh|navigate_reservation|navigate_billing|create_appointment`、`patientId`、`runId`、`dataSourceTransition.from/to`、`fallbackUsed`、`manualRefresh` を記録。
- Telemetry funnel: `charts_orchestration` に `orca_summary_load` / `orca_summary_refresh` を追加し、失敗/成功/transition 変化を計測。`resolve_master` と同じ traceId を carry する。
- CTA 成功時に `data-run-id` を含む breadcrumb を残し、DocumentTimeline/PatientsTab と突合できるようにする。

## 10. 次アクション
1. OrcaSummary コンポーネントへ `appointmentSummary` セクションと 4 ボタン（予約/会計/再取得/新規予約）を追加し、`charts-claim-ui-policy` の aria/tone に沿った実装を行う。
2. `fallbackUsed=true` 時の暫定計算ラベルと ActionBar disable 理由（`fallback_used`）をコードへ反映し、E2E（playwright）に WARN トーン検証を追加。
3. `dataSourceTransition` の理由表記（mock→server / server→snapshot / server→fallback / fallback→server）を `ux/charts/tones.ts` に追記し、OrcaSummary/Topbar/DocumentTimeline で同一 copy を再利用する。
