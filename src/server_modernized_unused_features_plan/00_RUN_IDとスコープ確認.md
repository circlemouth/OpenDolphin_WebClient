# 00 RUN_ID とスコープ確認（Webクライアント）

- RUN_ID: 20260114T062533Z
- YAML ID: `src/server_modernized_unused_features_plan/00_RUN_IDとスコープ確認.md`

## 目的
- Webクライアント未使用の機能を **Webクライアント側で接続・実装** する。
- 対象スコープと参照チェーンを明示し、後続タスクの前提を固定する。

## RUN_ID ルール
- RUN_ID は `YYYYMMDDThhmmssZ`（UTC）で採番する。
- 本ガント内で派生 RUN を作る場合は、親 RUN_ID（本ファイル）をログ先頭・報告に必ず明記する。

## 参照チェーン（必読）
1. `docs/DEVELOPMENT_STATUS.md`
2. `docs/web-client-unused-features.md`
3. `docs/web-client/architecture/web-client-api-mapping.md`
4. `docs/web-client/README.md`
5. `web-client/src/libs/http/httpClient.ts`
6. 本ガント（本ファイル）

## 対象スコープ（実装対象）
- ORCA wrapper（JSON）: 予約/受付/請求試算、患者検索/一覧/保存
- ORCA公式 XML プロキシ（XML）: acceptlstv2 / system01lstv2 / manageusersv2 / insprogetv2
- ORCA内製ラッパー（JSON・stub混在）: 診療セット/点数同期/出産育児/診療記録/患者更新/主訴登録
- Legacy REST: PVT/Appo/Karte/Stamp/Patient/Letter/Schedule/Reporting/Lab/MML/ChartEvent/System/ServerInfo/Demo
- Touch / ADM / PHR 系: touch/adm20/adm10 までの関連 Resource 群

## Done 定義（本計画全体）
- Webクライアントの API モジュール・画面・監査/観測・MSW/テストが揃う。
- 実測・ログ・更新ドキュメントが RUN_ID 付きで残る。

## ローカル検証（前提）
- 起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- ログイン情報: `setup-modernized-env.sh` 記載のものを使用する。
