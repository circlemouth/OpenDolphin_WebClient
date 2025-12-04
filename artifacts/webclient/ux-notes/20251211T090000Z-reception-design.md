# RUN_ID=20251211T090000Z 受付 UX/OrderConsole tone 同期メモ

- 目的: `docs/web-client/ux/reception-schedule-ui-policy.md` で決めたバナー/ARIA トーン、`tone=server` の文言構造、`dataSourceTransition` 監査メタを Reception と OrderConsole に再統一し、12/11-12/12 のステークホルダー向けレビューで証跡として提示する。

## 1. スクリーンショット候補
1. `artifacts/webclient/ux-notes/20251211T090000Z-reception-design-reception-banner.png`: Reception ヘッダー直下のバナー領域で Error/Warning/Info の色パレット、`role=alert` + `aria-live` 属性、`[prefix][ステータス][患者ID/受付ID]` 構造をキャプチャ。OrderConsole から戻るときに `data-run-id` が carry over されている状態を含める。
2. `artifacts/webclient/ux-notes/20251211T090000Z-reception-design-orderconsole-banner.png`: OrderConsole の ORCA 送信結果パネル（`tone=server` で赤/琥珀のバナー）と再送ボタン。バナー内で `dataSourceTransition=server` や `AuditEvent` の `runId` を参照できるメタを表示する箇所をスクリーンショット化。
3. `artifacts/webclient/ux-notes/20251211T090000Z-reception-design-datasource-transition.png`: `resolveMasterSource` から OrderConsole に至る `dataSourceTransition` フローをあらわすコード片とステータス遷移図を並べたサイドスクロール記録。スライド/デザイン資料としてこの PNG をレビューに添える。

## 2. 参照コード・資料ピックアップ
- `docs/web-client/ux/reception-schedule-ui-policy.md §5` のバナー構造（色・`role=alert`・`aria-live`・`data-run-id`）を OrderConsole にも再現し、Reception から `tone=server` が届いたときの文言を `[prefix][ステータス][患者ID/受付ID][送信先][再送可否][次アクション]` で揃える。
- `docs/web-client/ux/charts-claim-ui-policy.md §10` にある OrderConsole の `FilterBadge`/`DataSourceBanner` で `missingMaster`/`fallbackUsed`/`dataSourceTransition` を `aria-live=polite` で更新する実装を WebClient 版に転載し、Reception の `tone=server` を OrderConsole の `tone=server` と 1:1 で対応させる。
- `docs/web-client/architecture/web-client-api-mapping.md §2` の `resolveMasterSource` フロー（MSW→snapshot→server→fallback）と `fetchWithResolver` による `runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed` 付与。この図を常に OrderConsole の `AuditEvent` ドキュメントで引用し、直感的に `tone=server` と `dataSourceTransition=server` が同期することを説明。
- `src/LEGACY:webclient_modernized_bridge/04_マスターデータ補完ブリッジ実装計画.md` の `resolveMasterSource(masterType)` helper。`WEB_ORCA_MASTER_SOURCE`（環境フラグ）→ server へのフェーズで `dataSourceTransition` を付与する仕組みを Reception/OrderConsole に共通化し、バナー表示と Audit 送出の両方で同じフィールド名を使う。
- すでに `docs/server-modernization/phase2/operations/logs/20251204T160000Z-reception-design.md` で記録した `tone=server` の CarryOver ルールを参照し、今回の RUN_ID=20251211T090000Z では `audits` で `order-console` 側メタを重ねて書き込む。

## 3. 差分観察とメタ要件
- Reception に戻ったとき `data-run-id` がずっと `20251211T090000Z` になるよう `tone=server` バナーを `aria-atomic=false` にして、二重読み上げを防ぐ。OrderConsole からの `AuditEvent` は `runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition` を漏れなく持ち、`dataSourceTransition=server` と `tone=server` が同時に存在するタイミングだけ color=琥珀/赤になる。
- `resolveMasterSource` が MSW→snapshot→server のどこにいるかで `tone` を切り替えるのではなく、`tone=server` になるのは `dataSourceTransition=server` の時だけ。これを Stage/Playwright で撮影し、`audits` に `dataSourceTransition.from`/`dataSourceTransition.to`/`reason` を添える。
- OrderConsole の再送 UI では、`AuditEvent` 送信時に `dataSourceTransition` を `audit.logUiState` に貼り付け、`tone=server` バナーの `data-run-id` を `OrderConsole` の `AuditSummary` へ `transferRunId` する仕組みを設計する。

## 4. 次の確認ステップ
1. Stage/Preview で `VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET` 環境を使い、Reception→OrderConsole の `tone=server` スイッチを Playwright で再現。表示順・`aria-live` 方向 `assertive`/`polite` の違いを録画し、ログに `dataSourceTransition=server` が含まれることを確認。
2. `docs/web-client/ux/reception-schedule-ui-policy.md` の Reception セクションに `tone=server` + `dataSourceTransition` ルールを追記し、`docs/web-client/ux/ux-documentation-plan.md` Reception サブセクションでこの artifact を参照する文言を追加。
3. `docs/web-client/planning/phase2/DOC_STATUS.md` `Web クライアント UX/Features` 行に RUN_ID=20251211T090000Z のログ/アーティファクト/04A1 doc を追記し、支援者が同じ RUN_ID で証跡を辿れるようにしておく。
