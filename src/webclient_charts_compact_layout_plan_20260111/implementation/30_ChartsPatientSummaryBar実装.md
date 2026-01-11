# 30 ChartsPatientSummaryBar 実装

- RUN_ID: `20260111T082113Z`
- 期間: 2026-01-12 09:00 〜 2026-01-13 09:00 (JST) / 優先度: high / 緊急度: high / エージェント: codex
- YAML ID: `src/webclient_charts_compact_layout_plan_20260111/implementation/30_ChartsPatientSummaryBar実装.md`

## 参照
- `docs/DEVELOPMENT_STATUS.md`
- `docs/web-client/ux/charts-compact-layout-proposal-20260110.md`
- `src/webclient_charts_compact_layout_plan_20260111/design/20_ChartsPatientSummaryBar設計.md`
- `src/webclient_charts_compact_layout_plan_20260111/design/23_共通化パーツ設計.md`

## 実装概要
- `ChartsPatientSummaryBar` を新設し、`charts-patient-header` / `charts-clinical-bar` / `charts-safety` を統合した。
- 安全表示の詳細を折りたたみ式に変更し、`RUN_ID` を右端へ集約した。
- 患者メモを専用カードに分離して配置し、今後の移設に備えた。

## 実装内容

### 1) SummaryBar コンポーネント追加
- `web-client/src/features/charts/ChartsPatientSummaryBar.tsx`
  - 患者識別・ID/診療情報・安全表示を 3 カラム構成で統合。
  - 安全表示の詳細は `charts-safety-detail` に集約し、トグルで開閉。
  - `missingMaster`/`fallbackUsed`/`cacheHit`/`dataSourceTransition` などを詳細内に表示。

### 2) ChartsPage 統合
- `web-client/src/features/charts/pages/ChartsPage.tsx`
  - 旧 `charts-patient-header` / `charts-clinical-bar` / `charts-safety-display` を置換。
  - 患者メモを `charts-patient-memo` カードへ移動。

### 3) スタイル更新
- `web-client/src/features/charts/styles.ts`
  - SummaryBar 用の 3 カラム + 折り返しレイアウトを追加。
  - RunIdBadge を右端に収めるための縮小スタイルを追加。
  - 患者メモカード用スタイルを追加。

## 動作確認・テスト
- `npm --prefix web-client ci --cache .npm-cache`
  - 初回 `npm --prefix web-client ci` は `~/.npm/_cacache` の権限エラーで失敗。
  - ローカルキャッシュ指定で再実行し成功。
- `npm --prefix web-client run test -- chartsAccessibility`
  - `src/features/charts/__tests__/chartsAccessibility.test.tsx` の 3 テストがパス。

## 残課題
- `PatientMetaRow` / `StatusPill` など共通化パーツへの置換は別タスクで対応。
- 安全表示トーンの優先順位（fallback/transition/cacheHit）の最終確定は設計 TODO に合わせて調整予定。
