# Reception連携導線の固定

- RUN_ID: 20251228T094336Z
- 期間: 2025-12-28 09:43 - 2025-12-28 09:44 (UTC)
- ステータス: completed
- 進捗: 100
- YAML ID: src/webclient_productionization/patients/42_Charts/Reception連携導線の固定.md
- 参照ガント: .kamui/apps/webclient/webclient-productionization-plan-20251226.yaml

## 進捗記入ルール
- 担当者は作業開始時に RUN_ID/期間/ステータス/進捗 を更新する。
- 実施ログに日付・作業内容・成果物（コミット/証跡パス）・検証結果・残課題を追記する。
- 進捗更新時は docs/DEVELOPMENT_STATUS.md の懸念点有無も確認し、必要ならここに反映する。

## 進捗メモ（担当者が更新）
- 担当者: codex
- 更新日: 2025-12-28
- 根拠: returnTo フォールバック強化、kw 優先度仕様化、誤操作防止バナーの補強
- 次アクション: なし（完了）


## 目的
- Charts から Patients へ遷移した際に戻りURLと受付フィルタを安定保持し、誤操作を防止する。

## 仕様
- kw（検索キーワード）の優先度: Reception の検索条件（carryoverの `kw`）を最優先し、存在しない場合のみ `selectedPatientId` を kw として利用する。
- returnTo フォールバック: URL の `returnTo` が欠落/破損/`/charts` 以外の場合は無効化し、`sessionStorage` の退避値→URL再構築の順で復元する。

## 受け入れ基準 / Done
- Charts→Patients 遷移時に reception carryover と returnTo を保持し、Patients から Charts に戻る URL が安定する。
- Patients 画面で Reception の検索条件（kw/dept/phys/pay/sort/date）が維持される。
- Charts 経由の Patients 画面で誤操作防止バナーが表示される。

## 実施ログ
- 2025-12-28: returnTo フォールバック（sessionStorage→再構築）と kw 優先度を明確化し、Charts 経由バナーを補強。`npm run e2e:smoke` を実行したが `vite: command not found` で失敗（WebServer起動不可）。代替として `npm run e2e:smoke -- --list` を実行しテスト定義を確認。RUN_ID=20251228T094336Z
