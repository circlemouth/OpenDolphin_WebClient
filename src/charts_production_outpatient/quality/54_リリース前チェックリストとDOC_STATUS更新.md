# 54 リリース前チェックリストと DOC_STATUS 更新（RUN_ID=`20251218T213011Z`）

- 期間: 2025-02-06 09:00 〜 2025-02-07 09:00 (JST) / 優先度: high / 緊急度: low / エージェント: cursor cli
- YAML ID: `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ドキュメント
- 基準: `src/charts_production_outpatient/01_外来機能の完全カバレッジ定義.md` の DoD（商用カルテ品質）

## 1. DoD 達成サマリ（証跡付き）
- **外来フロー完走/E2E**: Reception→Charts→送信→会計を Playwright で自動化し、MSW ON/OFF 両方で tone とガードを確認（`src/charts_production_outpatient/quality/50_Playwright外来カルテ主要シナリオ.md`）。
- **患者コンテキストと更新**: URL 復元/多タブ衝突防止（`workflow/30_外来受診コンテキスト確立.md`, `workflow/34_並行編集とロック表示.md`）と、Patients への委譲を含む患者基本/保険更新 round-trip を実装（`integration/43_patientmodv2_outpatient編集導線.md`）。
- **医療記録/請求/キュー統合**: 診断・処方など 5 セクションの部分表示（`integration/42_medicalmodv2_outpatient表示セクション分割.md`）、請求バンドルの state/再取得導線（`integration/40_claim_outpatient統合.md`）、ORCA キュー表示と滞留検知（`integration/45_orca_queueと送信ステータス表示.md`）を反映。
- **監査・テレメトリ**: `auditEvent` と `recordOutpatientFunnel` の runId/traceId 突合を完了（`quality/52_監査ログ_テレメトリ_証跡化.md`、`foundation/11_監査ログauditEvent統一.md`）。送信前チェックやエラー規約も統一済み（`workflow/33_ORCA送信フロー_送信前チェック.md`, `foundation/12_エラーハンドリングとリトライ規約.md`）。
- **アクセシビリティ/キーボード**: `/charts` a11y スキャンと主要ショートカットを固定し、重大違反 0 を確認（`quality/51_アクセシビリティ自動検査と手動監査.md`, `docs/web-client/planning/phase2/logs/20251217T113616Z-charts-keyboard-aria.md`）。
- **障害注入と復旧導線**: timeout/500/schema mismatch/queue 滞留を MSW で再現し、解除後の復旧導線を証跡化（`quality/53_障害注入_タイムアウト_スキーマ不一致.md`）。
- **設定配信/トグル**: `/api/admin/config`/`delivery` の配信と masterSource/tone の透過を実装（`integration/44_admin_config_deliveryフラグ同期.md`）。
- **パフォーマンス計測準備**: init/患者切替/タイムライン更新の P95 予算と計測マークを定義し、telemetry/audit 送出点を設計（`foundation/14_パフォーマンス予算と計測導入.md`）。

## 2. 未完了項目 / 既知制限 / 回避策
- **Stage/Preview 実 API 未再検証**: dev proxy 先（100.102.17.40:8000/443/8443）が TCP timeout のまま（`docs/web-client/operations/debugging-outpatient-bugs.md` の最新サマリ）。現状はローカル modernized + MSW/Playwright でのみ確認。回避: Stage/Preview 復旧後、`VITE_DISABLE_MSW=1 VITE_DEV_PROXY_TARGET=<stage>` で同 RUN_ID の HAR/trace を採取し DOC_STATUS に追記する。
- **パフォーマンス SLI 実測未実施**: P95 しきい値と telemetry マークは定義済みだが、Stage/Preview での実測（`foundation/14_パフォーマンス予算と計測導入.md` §5）が未消化。回避: Playwright を計測モードで走らせ、`docs/server-modernization/phase2/operations/logs/<RUN_ID>-charts-performance.md` に転記するまで本番アラート運用は有効化しない。
- **予約変更/キャンセルは Reception へ委譲**: 予約 API 統合（`integration/41_appointment_outpatient統合.md`）は閲覧・導線まで。変更/キャンセルは Reception に遷移して実行する設計のまま。本番運用では Reception 側で行い、Charts 側は state 反映と監査確認に限定する。
- **APM/外部モニタ未接続**: telemetry の Backend シンク/Sentry 連携は未決（`foundation/14_パフォーマンス予算と計測導入.md` §6）。回避: auditEvent と Playwright アーティファクトを一次ソースとし、シンク決定後に JSON スキーマを追加する。

## 3. 次アクション（RUN_ID=`20251218T213011Z` を流用）
1. Stage/Preview で `/charts` メインフローを MSW OFF で再走し、HAR/trace を `artifacts/webclient/e2e/20251218T213011Z/<stage|preview>/` に保存。
2. 上記結果を `docs/web-client/planning/phase2/DOC_STATUS.md` と `docs/web-client/README.md` の最新更新サマリに追記。
3. パフォーマンス計測 Playwright (`charts-performance.spec.ts` 予定) を走らせ、P95 しきい値超過の有無と telemetry 集計可否を確認。

---

## 証跡
- 本ドキュメント: `src/charts_production_outpatient/quality/54_リリース前チェックリストとDOC_STATUS更新.md`
- 参照ログ/成果物（抜粋）: 50 / 51 / 52 / 53 / 40 / 41 / 42 / 43 / 44 / 45 / 30 / 34 / 33 / 12 / 11 / 14（各 RUN_ID は本文参照）
