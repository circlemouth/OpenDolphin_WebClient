# Charts 患者サイドペイン仕上げログ（RUN_ID=`20251217T114005Z`）

- 目的: 患者サイドペインを閲覧中心に再編し、権限/missingMaster ガード・差分表示・履歴導線を整理する仕様を確定する。
- 成果物: `src/charts_production_outpatient/ux/25_患者サイドペイン_基本保険履歴_仕上げ.md`

## 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md`
- `docs/server-modernization/phase2/INDEX.md`
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`
- `src/charts_production_outpatient/00_RUN_IDと参照チェーン.md`

## インプット
- `docs/web-client/ux/charts-claim-ui-policy.md`, `docs/web-client/ux/patients-admin-ui-policy.md`
- `src/charts_production_outpatient/ux/20_ChartsシェルUI最終レイアウト.md`, `22_ToneBannerと状態Pillの一貫性.md`
- `src/charts_production_outpatient/foundation/10_セッションと権限ガード整理.md`, `11_監査ログauditEvent統一.md`, `12_エラーハンドリングとリトライ規約.md`, `14_パフォーマンス予算と計測導入.md`

## 決定サマリ
1. サイドペインは閲覧モードを既定とし、編集は role と `missingMaster/fallback`/`dataSourceTransition=server` でガード。Patients への deeplink を標準導線にする。
2. 基本/保険の差分パネルを 2 カラムで常設し、保存成功/失敗と連動する監査モーダルを追加。`auditEvent` の action/operation/outcome を UI から確認できる導線を用意。
3. 履歴タブを直近/期間/全期間の 3 分割とし、選択状態を強調＋ DocumentTimeline へのジャンプ CTA を提供。患者切替の audit/計測イベントを一貫して記録。
4. ToneBanner のミラー表示と aria-live 抑制、重要情報ストリップ二重配置など 20/22 の決定をサイドペインへ継承。

## 更新ファイル
- `src/charts_production_outpatient/ux/25_患者サイドペイン_基本保険履歴_仕上げ.md`
