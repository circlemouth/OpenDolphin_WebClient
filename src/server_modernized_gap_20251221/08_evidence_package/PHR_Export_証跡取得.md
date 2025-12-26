# PHR Export 証跡取得
- 期間: 2026-01-09 11:00 - 2026-01-10 11:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T132546Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/PHR_Export_証跡取得.md`

## 目的
- PHR Export の S3/署名 URL 実測と監査証跡を取得し、品質/リリースの証跡を揃える。
- 署名 URL の TTL とアクセス制御が要件に合致していることを確認する。

## 前提
- `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md` の設定方針が反映済み。
- 実行環境は `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` を使用。
- ORCA certification の実測が必要な場合は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従い、機微情報はマスクする。

## 実施手順（証跡取得）
1. サーバー起動状態を確認（起動済みなら再起動しない）。
2. Export ジョブ作成 → 署名 URL 取得 → ダウンロードまでを順に実行。
3. HTTP リクエスト/レスポンス、監査ログ、S3 取得ログを保存。
4. 署名 URL の TTL と失効挙動を確認し、ログに残す。

## Evidence 記録（取得物の保存先）
- HTTP:
  - `artifacts/orca-connectivity/<RUN_ID>/httpdump/modern/phr_export/`
- 監査ログ:
  - `artifacts/orca-connectivity/<RUN_ID>/logs/phr_export_audit.log`
- 署名 URL 検証ログ:
  - `artifacts/orca-connectivity/<RUN_ID>/logs/phr_export_signed_url_check.log`

## 実装状況
- 未着手（RUN_ID 付与のみ、実測は未実施）。

## 次アクション
1. Export の正常系（200 + ファイル取得）を確立。
2. TTL 失効と再取得の挙動を確認。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md`
- `src/server_modernized_gap_20251221/08_evidence_package/PHR_E2E_証跡.md`
- `docs/DEVELOPMENT_STATUS.md`
