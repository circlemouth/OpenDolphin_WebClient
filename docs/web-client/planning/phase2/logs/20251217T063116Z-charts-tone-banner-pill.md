# Charts ToneBanner/Pill 一貫性検討ログ（RUN_ID=`20251217T063116Z`）

- 目的: Charts 全域で ToneBanner と状態ピル（StatusBadge）の語彙/aria-live/次アクションを Reception と共通化し、missingMaster/fallbackUsed/cacheHit/dataSourceTransition 表示で誤通知を防ぐ。
- 成果物: `src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## インプット
- `docs/web-client/ux/reception-schedule-ui-policy.md`（tone/aria-live 既定とバナー→ピルの役割分担）
- `docs/web-client/ux/charts-claim-ui-policy.md`（Charts/Claim 共通 UX ポリシー）
- `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`（missingMaster/fallbackUsed ブロック条件）
- `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`（バナー配置とピル群の順序）

## 決定サマリ
1. ToneBanner 文言テンプレを Reception と揃え、`missingMaster/fallbackUsed/cacheHit/dataSourceTransition` を同じ語彙で説明。`aria-live` は error/warning=assertive, info=polite。
2. ピルは「計測指標＋定義＋影響＋次アクション」を短文表示し、同 runId では `aria-live=off` にしてバナーの読み上げを優先。順序は runId→dataSourceTransition→missingMaster→fallbackUsed→cacheHit に統一。
3. `missingMaster=true || fallbackUsed=true` は送信/編集/印刷をブロックし解除条件を明文化。解除時は `polite` で 1 回のみ通知。
4. 左ペイン「今日のチェック項目」は内容ミラーのみで `aria-live=off`。クリックで対象タブへジャンプして判断を速くする。
5. Playwright 追加観点: バナーが1回だけ読み上げられ、ピルは無言（aria-live=off）で属性が一致することを検証。

## 追加決定（2025-12-17 追記）
- テレメトリ: ToneBanner 更新時のみ `charts_orchestration` を送信し、payload は `{runId, transition, missingMaster, fallbackUsed, cacheHit, source='tone_banner', manualRefresh}`。不変値では送信しない。
- 監査粒度: 表示 `action='tone_banner_display'`、CTA 押下 `action='tone_banner_cta'` を分離し、`reason` と `outcome` を必須化。連打しても runId 同一なら 1 回のみ記録。
- CTA 配置/無効例: バナー右端に再取得（primary 32px）＋必要に応じ共有（ghost）。missingMaster/fallbackUsed 時は送信系 disable＋理由 tooltip を提示、cacheHit=false 時はボタン活性のまま。

## 次アクション
- DOC_STATUS と README Active リストへ本成果物を追記済み（RUN_ID 同期済み）。
- ToneBanner/StatusBadge 実装へ `aria-live=off` 受け入れ・tooltip 文言集約・CTA/disable 例を反映する実装タスクを派生させる。
