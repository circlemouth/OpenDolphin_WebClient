# 22 ToneBanner と状態 Pill の一貫性（webclient charts production outpatient plan）

- RUN_ID: `20251217T063116Z`
- 期間: 2026-01-06 09:00 〜 2026-01-08 09:00 (JST)
- 優先度: high / 緊急度: low / エージェント: cursor cli
- YAML ID: `src/charts_production_outpatient/ux/22_ToneBannerと状態Pillの一貫性.md`
- 参照: `docs/web-client/ux/reception-schedule-ui-policy.md`（RUN_ID=20251202T090000Z）、`docs/web-client/ux/charts-claim-ui-policy.md`、`src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`、`src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`

---

## 0. 結論（決めたこと）
- **tone 語彙を Reception と共通化**: `tone=server` は「マスタ取得待ち（warning）」、`fallbackUsed=true` は「フォールバック警告（error）」、`cacheHit=true` は「安定（info）」と固定し、Charts 全域で同じ文言テンプレを使う。
- **バナーとピルの役割分担を固定**: バナーは「状態+次の一手」を短文で示す。ピル（StatusBadge）は「計測指標と根拠」を表示し、ツールチップ/ヘルプで定義を読む場所にする。どちらにも `runId`/`dataSourceTransition`/`missingMaster`/`fallbackUsed`/`cacheHit` を透過する。
- **aria-live の強さを状態依存で切替**: `missingMaster=true` または `fallbackUsed=true` は `assertive`、`dataSourceTransition` が server/snapshot への遷移は `polite`、`cacheHit=true` は読み上げ抑制（`polite`＋一度だけ）。バナーとピルで重複読み上げしないよう、同一 runId では **バナー優先・ピルは aria-live=off** にする。
- **初見で判断できる情報量を担保**: `cacheHit/missingMaster/fallbackUsed` のピルに「定義・影響・次の手順」を 50 文字以内で記述。ツールチップは Reception と同じ表記（例: `missingMaster=true ｜ マスタ未取得、送信/編集を停止`）。
- **ガード／解除のトリガーを明文化**: `missingMaster=true || fallbackUsed=true` は送信/編集/印刷を disable。解除条件は `missingMaster=false && fallbackUsed=false && dataSourceTransition=server` を確認するまで継続し、解除時に info トーンで一度だけ `aria-live=polite` を鳴らす。

## 1. 参照チェーンと適用範囲
- 遵守: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`。
- 本ガイドは **Charts 全域（Topbar/ActionBar/左ペインチェック項目/OrcaSummary/DocumentTimeline/PatientsTab/OrderConsole/OutpatientMock）** に適用する。Reception で定義済みの ToneBanner/StatusBadge コンポーネントを拡張・再利用する前提。

## 2. ToneBanner の表現ルール（Reception と同語彙）
- **文章テンプレ**: `[種別 prefix][状態要約][対象][送信先][次アクション]` を `｜` で連結する（Reception と同形式）。
  - missingMaster: `tone=server ｜ missingMaster=true ｜ ORCA 送信を一時停止しマスタ再取得を待機`
  - fallbackUsed: `tone=error ｜ fallbackUsed=true ｜ フォールバックデータで処理中。管理者へ共有し再取得を実施`
  - cacheHit: `tone=info ｜ cacheHit=true ｜ マスタキャッシュ有効、ORCA 再送可能`
  - dataSourceTransition 変化: `dataSourceTransition=server ｜ tone=warning ｜ 再取得の間は tone=server を維持`
- **aria-live / role**: role=`alert` を維持。tone が error/warning のとき `assertive`、info のとき `polite`。`aria-atomic=false` で差分読み上げを許容。
- **配置**: `20_ChartsシェルUI最終レイアウト.md` のとおり、トップバーとアクションバーの間に全幅で配置し、左ペイン「今日のチェック項目」に同内容をミラー。重複読み上げを避けるため、ミラー側は `aria-live=off` とする。

## 3. 状態 Pill（StatusBadge/ResolveMasterBadge）の統一仕様
- **表示順**: `runId` → `dataSourceTransition` → `missingMaster` → `fallbackUsed` → `cacheHit`。Topbar のピル群と OrcaSummary/DocumentTimeline 内のバッジも同順で揃える。
- **tone と色**:
  - missingMaster: `warning`（assertive）、説明「マスタ未取得／送信停止」。
  - fallbackUsed: `error`（assertive）、説明「snapshot/fallback データ。監査・再取得必須」。
  - cacheHit: `success`（polite）、説明「キャッシュ命中で安定」。false は `warning`。
  - dataSourceTransition: `server|snapshot|mock|fallback` を Reception と同じ色/トーンで表示（warning 基調、fallback は error）。
- **ツールチップ/ヘルプ**: 各ピルは hover/focus で短い定義と影響、次アクションを表示（例: `missingMaster=true: ORCA 送信・編集不可。再取得 or Reception で master 更新`）。ピル自身の aria-live は `off`（初回挿入のみ polite）にし、バナーの読み上げを優先。
- **データ透過**: すべてのピルに `data-run-id`、`data-source-transition`、`data-cache-hit`、`data-missing-master`、`data-fallback-used` を付与し、Playwright/HAR で検証できるようにする。

## 4. aria-live 切替ポリシー（誤通知・過通知防止）
- **バナー優先**: 同じ runId で ToneBanner とピルが同時に更新されるとき、ピルは `aria-live=off`。バナーのみが読み上げ対象。
- **昇格・降格ルール**:
  - `false→true` (missingMaster/fallbackUsed): `assertive` で 1 回だけ読み上げ。再取得失敗で同じ値の場合は無言。
  - `true→false` (missingMaster/fallbackUsed): `polite` で 1 回だけ「解除」文言を読み上げ。
  - `dataSourceTransition` snapshot→server: `polite`。server→snapshot/fallback は warning/error に合わせ `assertive`。
  - `cacheHit` true: 初回のみ `polite`、以降の連続 true では読み上げ抑止。
- **キー操作時の抑制**: `manualRefresh` ボタン押下直後 3 秒間は `aria-live` を `polite` に固定し、連続取得による多重読み上げを防ぐ。

## 5. 実装タスクリスト（開発メモ）
1. `web-client/src/features/reception/components/ToneBanner.tsx` に `ariaLive='off'` 許容を追加し、Charts 側でピル重複読み上げを抑制できるようにする。
2. `web-client/src/features/shared/StatusBadge.tsx` に `aria-live='off'` デフォルトとツールチップ文言を受け取る props を追加。Reception と共通の tooltip 文を `ux/charts/tones.ts`（または新規 constants）へ集約。
3. Charts Topbar / OrcaSummary / DocumentTimeline / PatientsTab / OrderConsole でピル順・tone マッピングを統一し、`data-*` 属性を透過。`missingMaster|fallbackUsed` 解除時の `polite` 通知を 1 回だけ発火する実装フックを追加。
4. 左ペイン「今日のチェック項目」ミラーを `aria-live=off` に変更し、バナーの読み上げのみ残す。代わりに「クリックで対象タブへジャンプ」を強調するラベルを付与。
5. Playwright 追加観点: missingMaster/fallbackUsed/cacheHit/dataSourceTransition の各遷移で **バナー1回のみ読み上げ**、ピルは無言であることを assertion。`data-run-id`/`data-source-transition` の属性一致も検証。

## 6. 証跡・同期
- 証跡ログ: `docs/web-client/planning/phase2/logs/20251217T063116Z-charts-tone-banner-pill.md`
- DOC_STATUS と README の Active リストに本ドキュメントを追加（RUN_ID を併記）。
