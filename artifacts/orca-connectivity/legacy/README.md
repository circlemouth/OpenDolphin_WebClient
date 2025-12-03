# legacy/ 配下の扱い（RUN_ID=20251203T152220Z）

## 目的
- `https://weborca.cloud.orcamo.jp` 以外（Trial/ORMaster/mac-dev/localhost など）宛の ORCA 通信ログを混在させないため、非現行ログを本ディレクトリへ集約する。

## 現在の内容
- 2025-11-08〜2025-11-22 の Trial/ORMaster/localhost 宛ログ一式を `artifacts/orca-connectivity/legacy/` へ移動済み（RUN_ID=20251203T152220Z）。
- 例: `20251121TrialPHRSeqZ1*`（Trial 404/405）、`20251122T073700Z_ORMaster_Connectivity`（ORMaster DNS）、`20251120TrialConnectivityWSLZ1`（Trial CRUD テンプレ）ほか。
- `backup/`, `TEMPLATE`, `seed/` 等の現行テンプレート・WebORCA 本番宛ログは親ディレクトリ直下に残し、混在を防止。

## 運用ルール
- 本ディレクトリのログは「参照のみ」。再利用時は現行ホスト（`weborca.cloud.orcamo.jp`）向けに再取得し、親ディレクトリに RUN_ID 付きで保存すること。
- 新たに Trial/ORMaster など非現行ホストの証跡を追加する場合も、RUN_ID サブディレクトリを本 `legacy/` 配下に作成し、README を更新して混同を防止する。

## 備考
- 移動前の構成・実行コマンドは `docs/server-modernization/phase2/operations/logs/20251203T152220Z-orca-log-cleanup.md` に記録。
