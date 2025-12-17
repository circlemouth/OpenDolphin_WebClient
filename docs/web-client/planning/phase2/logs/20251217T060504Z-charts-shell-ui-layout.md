# Charts シェル UI 最終レイアウトログ（RUN_ID=`20251217T060504Z`）

- 目的: Charts 本番外来のヘッダー/アクションバー/左右ペイン/本文のレイアウトを確定し、重要情報を常時視認できる位置に統一する。
- 成果物: `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## インプット
- `docs/web-client/ux/charts-claim-ui-policy.md`（レイアウト比率・トーン）
- `src/charts_production_outpatient/02_ChartsPage現状棚卸しとギャップ.md`（現状不足とギャップ）
- `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`
- `src/charts_production_outpatient/foundation/12_エラーハンドリングとリトライ規約.md`
- `src/charts_production_outpatient/foundation/13_データ取得レイヤの統一_fetchWithResolver.md`

## 決定サマリ
1. トップバー（72px）＋アクションバー（64px）を sticky で積み、左 30% / 右 70% 基準の 2 ペインをデフォルトに固定。バナーはトップとアクションの間に全幅表示。
2. 重要情報（患者/受付ID/保険トグル/runId/dataSourceTransition/missingMaster/fallbackUsed/cacheHit）はトップバー右のピル群＋左ペイン上のストリップに二重配置し、狭幅でも隠れない折返しルールを決定。
3. 画面幅別に wide/default/medium/narrow の 4 段階レイアウトを定義し、<1024px では左ペインをドロワー化、主要操作は 2 行化せず sticky を維持。
4. missingMaster/fallbackUsed 時は送信系 disable＋ToneBanner warning、右ペインタブは空状態＋再取得導線、左ペインは閲覧のみ。dataSourceTransition 変化はピルとチェック項目にミラーし warning/polite で読み上げ。
5. コンポーネント割り当て: ChartsHeader/ActionBar のレスポンシブ化、ImportantStrip 新設、SideDrawer 化、manualRefresh/ピルクリック/ドロワー開閉の監査・テレメトリ追加を次アクションに設定。

## 更新ファイル
- `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`
